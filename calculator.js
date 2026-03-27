/**
 * eScribe ROI Calculator
 * Calculates time savings, cost savings, and compliance risk reduction
 */

// Currency configuration
let currentCurrency = 'USD';
const EXCHANGE_RATE = 1.36; // USD to CAD

// Configuration and benchmarks
const CONFIG = {
    // Hours with eScribe (benchmark with automation)
    hoursWithEscribe: 4,
    
    // Printing cost per page (B&W laser)
    costPerPage: 0.07,
    baselineByOrgSize: { small: 12000, medium: 18000, large: 45000, major: 75000 },
    
    // Organization size defaults (committee + council = total meetings)
    orgSizeDefaults: {
        small: {
            committee: 15,
            council: 12,
            staff: 2,
            hours: 8,
            rate: 29,
            pages: 100,
            copies: 10
        },
        medium: {
            committee: 24,
            council: 12,
            staff: 3,
            hours: 10,
            rate: 29,
            pages: 150,
            copies: 15
        },
        large: {
            committee: 36,
            council: 12,
            staff: 4,
            hours: 12,
            rate: 29,
            pages: 175,
            copies: 20
        },
        major: {
            committee: 60,
            council: 12,
            staff: 5,
            hours: 14,
            rate: 29,
            pages: 200,
            copies: 25
        }
    },
    
    // Compliance risk benchmarks by organization size
    complianceRisk: {
        small: {
            high: { exposure: 50000, probability: 0.10 },
            medium: { exposure: 30000, probability: 0.05 },
            low: { exposure: 15000, probability: 0.02 }
        },
        medium: {
            high: { exposure: 150000, probability: 0.20 },
            medium: { exposure: 75000, probability: 0.10 },
            low: { exposure: 35000, probability: 0.05 }
        },
        large: {
            high: { exposure: 250000, probability: 0.30 },
            medium: { exposure: 125000, probability: 0.15 },
            low: { exposure: 50000, probability: 0.07 }
        },
        major: {
            high: { exposure: 400000, probability: 0.40 },
            medium: { exposure: 200000, probability: 0.20 },
            low: { exposure: 75000, probability: 0.10 }
        }
    },
    
    // Risk with eScribe (significantly reduced)
    escribeRiskReduction: 0.80, // 80% risk reduction

    /** Share of modeled labor+print savings counted in ROI (year-one capture / attribution). Full savings still shown elsewhere. */
    defaultRoiSavingsAttribution: 0.70
};

// DOM Elements
const elements = {
    // Inputs
    orgSize: document.getElementById('orgSize'),
    committeeMeetings: document.getElementById('committeeMeetings'),
    councilMeetings: document.getElementById('councilMeetings'),
    staffCount: document.getElementById('staffCount'),
    hoursPerMeeting: document.getElementById('hoursPerMeeting'),
    hoursPerMeetingValue: document.getElementById('hoursPerMeetingValue'),
    hourlyRate: document.getElementById('hourlyRate'),
    escribeAnnualCost: document.getElementById('escribeAnnualCost'),
    roiOtherAnnualCost: document.getElementById('roiOtherAnnualCost'),
    roiAttributionPct: document.getElementById('roiAttributionPct'),
    packetPages: document.getElementById('packetPages'),
    printedCopies: document.getElementById('printedCopies'),
    
    // Compliance checkboxes
    comp1: document.getElementById('comp1'),
    comp2: document.getElementById('comp2'),
    comp3: document.getElementById('comp3'),
    comp4: document.getElementById('comp4'),
    comp5: document.getElementById('comp5'),
    
    // Compliance display
    complianceScoreBox: document.getElementById('complianceScoreBox'),
    complianceScore: document.getElementById('complianceScore'),
    
    // Results - Summary
    totalHoursSaved: document.getElementById('totalHoursSaved'),
    printingCostNow: document.getElementById('printingCostNow'),
    complianceRisk: document.getElementById('complianceRisk'),
    
    // Results - Breakdown
    laborSavings: document.getElementById('laborSavings'),
    staffCountDetail: document.getElementById('staffCountDetail'),
    meetingsCountDetail: document.getElementById('meetingsCountDetail'),
    hoursSavedPerMeetingDetail: document.getElementById('hoursSavedPerMeetingDetail'),
    hoursSavedDetail: document.getElementById('hoursSavedDetail'),
    hoursSavedPerStaffDetail: document.getElementById('hoursSavedPerStaffDetail'),
    hoursSavedPerStaffWrap: document.getElementById('hoursSavedPerStaffWrap'),
    hourlyRateDetail: document.getElementById('hourlyRateDetail'),
    laborProgress: document.getElementById('laborProgress'),
    
    printSavings: document.getElementById('printSavings'),
    meetingsDetail: document.getElementById('meetingsDetail'),
    pagesDetail: document.getElementById('pagesDetail'),
    copiesDetail: document.getElementById('copiesDetail'),
    printProgress: document.getElementById('printProgress'),
    
    complianceSavings: document.getElementById('complianceSavings'),
    complianceProgress: document.getElementById('complianceProgress'),
    
    // Time comparison
    manualBar: document.getElementById('manualBar'),
    manualHours: document.getElementById('manualHours'),
    escribeBar: document.getElementById('escribeBar'),
    escribeHours: document.getElementById('escribeHours'),
    timeSavingsPercent: document.getElementById('timeSavingsPercent'),
    
    // Risk detail
    riskDetailBox: document.getElementById('riskDetailBox'),
    riskMessage: document.getElementById('riskMessage'),
    avgSettlement: document.getElementById('avgSettlement'),
    
    // Time-based ROI % (percent of meeting prep time recovered)
    roiPercent: document.getElementById('roiPercent'),
    roiFormulaHint: document.getElementById('roiFormulaHint'),
    roiContext: document.getElementById('roiContext')
};

// Helper functions
function formatNumber(num) {
    return Math.round(num).toLocaleString('en-US');
}

function formatCurrency(num) {
    const converted = currentCurrency === 'CAD' ? num * EXCHANGE_RATE : num;
    return Math.round(converted).toLocaleString('en-US');
}

function updateCurrencyLabels() {
    const usdBtn = document.getElementById('usdBtn');
    const cadBtn = document.getElementById('cadBtn');
    
    if (usdBtn && cadBtn) {
        if (currentCurrency === 'USD') {
            usdBtn.classList.add('active');
            cadBtn.classList.remove('active');
        } else {
            usdBtn.classList.remove('active');
            cadBtn.classList.add('active');
        }
    }
    
    // Update static currency values in the page
    document.querySelectorAll('.currency-value').forEach(el => {
        const usdValue = parseFloat(el.dataset.usd);
        if (!isNaN(usdValue)) {
            el.textContent = '$' + formatCurrency(usdValue);
        }
    });
}

function getComplianceLevel() {
    const checks = [
        elements.comp1.checked,
        elements.comp2.checked,
        elements.comp3.checked,
        elements.comp4.checked,
        elements.comp5.checked
    ];
    const checkedCount = checks.filter(Boolean).length;
    
    if (checkedCount <= 1) return 'high';
    if (checkedCount <= 3) return 'medium';
    return 'low';
}

function updateComplianceDisplay(level) {
    const box = elements.complianceScoreBox;
    const score = elements.complianceScore;
    const riskBox = elements.riskDetailBox;
    
    // Remove all classes
    box.classList.remove('low-risk', 'medium-risk', 'high-risk');
    score.classList.remove('low-risk', 'medium-risk', 'high-risk');
    riskBox.classList.remove('low-risk');
    
    // Add appropriate class
    box.classList.add(level + '-risk');
    score.classList.add(level + '-risk');
    
    // Update text
    const labels = {
        high: 'High Risk',
        medium: 'Medium Risk',
        low: 'Low Risk'
    };
    score.textContent = labels[level];
    
    // Update risk message - now framed as protection
    const messages = {
        high: 'Without automated compliance tools, your organization faces significant exposure to open meetings and public records lawsuits. eScribe\'s automated notice posting, WCAG-compliant publishing, and record retention protect you from these costly violations.',
        medium: 'Your organization has some compliance measures in place. eScribe strengthens your protection with automated workflows that ensure consistent compliance with open meetings laws and accessibility requirements.',
        low: 'You have good compliance practices. eScribe provides an additional layer of protection with automated audit trails, compliant document publishing, and built-in record retention policies.'
    };
    elements.riskMessage.textContent = messages[level];
    
    if (level === 'low') {
        riskBox.classList.add('low-risk');
    }
}

// Main calculation function
function calculate() {
    // Get input values
    const orgSize = elements.orgSize.value;
    const committee = parseInt(elements.committeeMeetings.value, 10) || 0;
    const council = parseInt(elements.councilMeetings.value, 10) || 0;
    const meetings = (committee + council) > 0 ? committee + council : 48;
    const staff = parseInt(elements.staffCount.value) || 3;
    let hoursManual = parseInt(elements.hoursPerMeeting.value, 10);
    if (isNaN(hoursManual) || hoursManual < 0) hoursManual = 10;
    const hourlyRate = parseFloat(elements.hourlyRate.value) || 29;
    const escribeCostRaw = parseFloat(String(elements.escribeAnnualCost && elements.escribeAnnualCost.value || '').replace(/,/g, ''), 10);
    const escribeAnnualCost = (!isNaN(escribeCostRaw) && escribeCostRaw > 0) ? escribeCostRaw : 0;
    const otherInvRaw = parseFloat(String(elements.roiOtherAnnualCost && elements.roiOtherAnnualCost.value || '').replace(/,/g, ''), 10);
    const otherAnnualInvestment = (!isNaN(otherInvRaw) && otherInvRaw > 0) ? otherInvRaw : 0;
    let attribution = CONFIG.defaultRoiSavingsAttribution;
    if (elements.roiAttributionPct && elements.roiAttributionPct.value !== '') {
        const p = parseFloat(elements.roiAttributionPct.value, 10);
        if (!isNaN(p) && p > 0 && p <= 100) attribution = p / 100;
    }
    const pages = parseInt(elements.packetPages.value) || 150;
    const copies = parseInt(elements.printedCopies.value) || 15;
    
    const hoursWithEscribe = CONFIG.hoursWithEscribe;
    const hoursSavedPerMeeting = Math.max(0, hoursManual - hoursWithEscribe);
    const totalHoursSaved = staff * meetings * hoursSavedPerMeeting;
    const laborSavings = totalHoursSaved * hourlyRate;
    const printSavings = meetings * pages * copies * CONFIG.costPerPage;
    const currentLaborCost = staff * meetings * hoursManual * hourlyRate;
    const currentPrintCost = meetings * pages * copies * CONFIG.costPerPage;
    const annualBaseline = (CONFIG.baselineByOrgSize && CONFIG.baselineByOrgSize[orgSize]) || 12000;
    const currentAnnualPrepCost = annualBaseline + currentLaborCost + currentPrintCost;
    const timeSavingsPercent = hoursManual > 0 ? Math.round((hoursSavedPerMeeting / hoursManual) * 100) : 0;
    const totalSavingsGross = laborSavings + printSavings;
    const savingsCountedForRoi = totalSavingsGross * attribution;
    const totalAnnualInvestment = escribeAnnualCost + otherAnnualInvestment;
    const netBenefitForRoi = savingsCountedForRoi - totalAnnualInvestment;
    let roiDisplay = '—';
    if (escribeAnnualCost > 0) {
        const trueRoiPct = Math.round((netBenefitForRoi / totalAnnualInvestment) * 100);
        roiDisplay = `${trueRoiPct}%`;
    }
    
    // Calculate compliance risk
    const complianceLevel = getComplianceLevel();
    updateComplianceDisplay(complianceLevel);
    
    const riskData = CONFIG.complianceRisk[orgSize][complianceLevel];
    const currentRiskExposure = riskData.exposure;
    const currentProbability = riskData.probability;
    
    // Annual expected cost without eScribe
    const annualRiskCostWithout = (currentRiskExposure * currentProbability) / 5; // 5-year probability
    
    // With eScribe (80% risk reduction)
    const reducedExposure = currentRiskExposure * (1 - CONFIG.escribeRiskReduction);
    const reducedProbability = currentProbability * (1 - CONFIG.escribeRiskReduction);
    const annualRiskCostWith = (reducedExposure * reducedProbability) / 5;
    
    const complianceSavings = annualRiskCostWithout - annualRiskCostWith;
    
    // Total savings and value
    const totalSavings = totalSavingsGross;
    const totalValue = totalSavings + complianceSavings;
    
    // Update display - Summary cards
    elements.totalHoursSaved.textContent = formatNumber(totalHoursSaved);
    elements.printingCostNow.textContent = formatCurrency(printSavings);
    elements.complianceRisk.textContent = formatCurrency(currentRiskExposure);
    
    // Update display - Breakdown (printing + compliance only)
    elements.printSavings.textContent = formatCurrency(printSavings);
    elements.meetingsDetail.textContent = meetings;
    elements.pagesDetail.textContent = pages;
    elements.copiesDetail.textContent = copies;
    
    elements.complianceSavings.textContent = formatCurrency(complianceSavings);
    
    // Update progress bars (print + compliance only)
    const totalForProgress = printSavings + complianceSavings;
    if (totalForProgress > 0) {
        elements.printProgress.style.width = `${(printSavings / totalForProgress) * 100}%`;
        elements.complianceProgress.style.width = `${(complianceSavings / totalForProgress) * 100}%`;
    }
    
    // Update time comparison
    const maxHours = Math.max(hoursManual, 50);
    elements.manualBar.style.width = `${(hoursManual / maxHours) * 100}%`;
    elements.manualHours.textContent = `${hoursManual} hours`;
    elements.escribeBar.style.width = `${(hoursWithEscribe / maxHours) * 100}%`;
    elements.escribeHours.textContent = '4 hours';
    elements.timeSavingsPercent.textContent = `${timeSavingsPercent}%`;
    
    // Update risk detail
    elements.avgSettlement.textContent = formatCurrency(currentRiskExposure);
    
    if (elements.roiPercent) elements.roiPercent.textContent = roiDisplay;
    if (elements.roiFormulaHint) {
        const pctLabel = Math.round(attribution * 100);
        if (escribeAnnualCost > 0) {
            elements.roiFormulaHint.textContent =
                `ROI = (modeled labor + print savings × ${pctLabel}% − total annual investment) ÷ total annual investment. Savings cards above use 100% modeled savings.`;
        } else {
            elements.roiFormulaHint.textContent =
                `ROI = (modeled savings × ${pctLabel}% − eScribe subscription − other annual costs) ÷ (subscription + other costs). Enter annual eScribe software cost under Hourly Rate.`;
        }
    }
}

// Update defaults when organization size changes
function updateDefaults() {
    if (!elements.orgSize) return;
    const size = elements.orgSize.value;
    const defaults = CONFIG.orgSizeDefaults[size];
    if (!defaults) return;

    elements.committeeMeetings.value = defaults.committee;
    elements.councilMeetings.value = defaults.council;
    elements.staffCount.value = defaults.staff;
    elements.hoursPerMeeting.value = defaults.hours;
    elements.hoursPerMeetingValue.textContent = defaults.hours;
    elements.hourlyRate.value = defaults.rate;
    elements.packetPages.value = defaults.pages;
    elements.printedCopies.value = defaults.copies;
    
    calculate();
}

// Event listeners (attach after DOM ready so org-size change reliably updates values)
function attachListeners() {
    if (elements.orgSize) elements.orgSize.addEventListener('change', updateDefaults);
}
elements.committeeMeetings.addEventListener('input', calculate);
elements.councilMeetings.addEventListener('input', calculate);
elements.staffCount.addEventListener('input', calculate);
elements.hoursPerMeeting.addEventListener('input', function() {
    elements.hoursPerMeetingValue.textContent = this.value;
    calculate();
});
elements.hourlyRate.addEventListener('input', calculate);
if (elements.escribeAnnualCost) elements.escribeAnnualCost.addEventListener('input', calculate);
if (elements.roiOtherAnnualCost) elements.roiOtherAnnualCost.addEventListener('input', calculate);
if (elements.roiAttributionPct) elements.roiAttributionPct.addEventListener('change', calculate);
elements.packetPages.addEventListener('input', calculate);
elements.printedCopies.addEventListener('input', calculate);

// Compliance checkboxes
elements.comp1.addEventListener('change', calculate);
elements.comp2.addEventListener('change', calculate);
elements.comp3.addEventListener('change', calculate);
elements.comp4.addEventListener('change', calculate);
elements.comp5.addEventListener('change', calculate);

// Currency toggle buttons
const usdBtn = document.getElementById('usdBtn');
const cadBtn = document.getElementById('cadBtn');

if (usdBtn && cadBtn) {
    usdBtn.addEventListener('click', function() {
        currentCurrency = 'USD';
        updateCurrencyLabels();
        calculate();
    });
    
    cadBtn.addEventListener('click', function() {
        currentCurrency = 'CAD';
        updateCurrencyLabels();
        calculate();
    });
}

// Initialize: set inputs from selected org size so default is 48 meetings (960 hrs) like original
document.addEventListener('DOMContentLoaded', function() {
    attachListeners();
    updateDefaults(); // sync committee/council etc. to org size so total meetings = 48 for Medium
    updateCurrencyLabels();
    calculate();
});
