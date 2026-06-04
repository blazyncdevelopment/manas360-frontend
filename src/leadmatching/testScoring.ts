import { calculateLeadScore, getMatchBand, calculateLeadPrice } from './scoring';
import { MOCK_PATIENTS, MOCK_PROVIDERS } from './mockData';

function runTests() {
  console.log('=== LEADS MATCHING ENGINE TEST RUN ===\n');

  // Test Case 1: Rohan Sharma (STARTER, Domestic) vs Domestic Patient
  console.log('--- Test Case 1: Starter Provider vs Domestic Patient ---');
  const patient1 = MOCK_PATIENTS.domestic_anxiety_patient;
  const provider1 = MOCK_PROVIDERS.starter_therapist;
  
  const result1 = calculateLeadScore(patient1, provider1);
  console.log(`Provider: ${provider1.name}`);
  console.log(`Patient: ${patient1.id} (Location: ${patient1.preferences.timezoneRegion})`);
  console.log(`Scores: Expertise: ${result1.expertiseScore}, Comm: ${result1.communicationScore}, Quality: ${result1.qualityScore}`);
  console.log(`Final Match Score: ${result1.finalScore}`);
  console.log(`Eligible: ${result1.isEligible} ${result1.exclusionReason ? `(${result1.exclusionReason})` : ''}`);
  if (result1.isEligible) {
    const band = getMatchBand(result1.finalScore);
    const price = calculateLeadPrice(result1.finalScore, patient1.preferences.context);
    console.log(`Match Band: ${band}`);
    console.log(`Price to Accept: Rs. ${price}`);
  }
  console.log();

  // Test Case 2: Dr. Akash Dutta (PREMIUM, NRI pool) vs NRI Patient
  console.log('--- Test Case 2: Premium NRI Psychiatrist vs NRI US Patient ---');
  const patient2 = MOCK_PATIENTS.nri_us_patient;
  const provider2 = MOCK_PROVIDERS.premium_psychiatrist;

  const result2 = calculateLeadScore(patient2, provider2);
  console.log(`Provider: ${provider2.name}`);
  console.log(`Patient: ${patient2.id} (Location: ${patient2.preferences.timezoneRegion})`);
  console.log(`Scores: Expertise: ${result2.expertiseScore}, Comm: ${result2.communicationScore}, Quality: ${result2.qualityScore}`);
  console.log(`Final Match Score: ${result2.finalScore}`);
  console.log(`Eligible: ${result2.isEligible} ${result2.exclusionReason ? `(${result2.exclusionReason})` : ''}`);
  if (result2.isEligible) {
    const band = getMatchBand(result2.finalScore);
    const price = calculateLeadPrice(result2.finalScore, patient2.preferences.context);
    console.log(`Match Band: ${band}`);
    console.log(`Price to Accept: Rs. ${price}`);
  }
  console.log();

  // Test Case 3: Rohan Sharma (STARTER, non-NRI) vs NRI Patient (Should fail timezone/NRI pool certification check)
  console.log('--- Test Case 3: Starter Provider vs NRI US Patient (Expected: Exclusion) ---');
  const result3 = calculateLeadScore(patient2, provider1);
  console.log(`Provider: ${provider1.name}`);
  console.log(`Patient: ${patient2.id} (Location: ${patient2.preferences.timezoneRegion})`);
  console.log(`Eligible: ${result3.isEligible} ${result3.exclusionReason ? `(Exclusion Reason: ${result3.exclusionReason})` : ''}`);
  console.log();

  // Test Case 4: Unverified Provider (Should fail verification gate check)
  console.log('--- Test Case 4: Unverified Provider vs Domestic Patient (Expected: Gate Exclusion) ---');
  const provider3 = MOCK_PROVIDERS.unverified_therapist;
  const result4 = calculateLeadScore(patient1, provider3);
  console.log(`Provider: ${provider3.name}`);
  console.log(`Patient: ${patient1.id}`);
  console.log(`Eligible: ${result4.isEligible} ${result4.exclusionReason ? `(Exclusion Reason: ${result4.exclusionReason})` : ''}`);
  console.log('\n=== TEST RUN COMPLETED ===');
}

runTests();
