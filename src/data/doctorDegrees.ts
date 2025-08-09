// Doctor Degree Mapping for Prescription Templates
// Maps doctor names to their medical degrees

export interface DoctorDegree {
  name: string;
  degree: string;
}

// Department-based degree mapping for prescription display
export const DEPARTMENT_DEGREES: Record<string, string> = {
  "ORTHOPEDIC": "M.S. ORTHO/ KNEE SPECIALIST",
  "ORTHOPAEDIC": "M.S. ORTHO/ KNEE SPECIALIST",
  "DIETICIAN": "M.SC & phD IN FOOD & NUTRITION",
  "GYN": "MBBS, MS, MENOPAUSE SPECIALIST CONSULTANT - OBSTRETRICS & GYNAECOLOGY",
  "GENERAL PHYSICIAN": "MBBS ( RNT MEDICAL COLLEGE)",
  "ENDOCRINOLOGY": "MBBS, MD MEDICINE MRCP Endocrinology (UK)",
  "NEUROLOGY": "MD. DNB. (Neurology)",
  "UROLOGY": "MS, MCH, ( UROLOGY & KIDNEY TRANSPLANT), CONSULTANT UROLOGIST LAPAROSCOPIC & ROBOTIC UROSURGEON",
  "SURGICAL ONCOLOGY": "MBBS,DNB (GEN. SURGERY),DRNB (SURGICSAL ONCOLOGY) CONSULTANT CANCER SURGEONE",
  "MEDICAL ONCOLOGY": "MD, DNB (MEDICAL ONCOLOGY)",
  "NEUROSURGERY": "M.S GENERAL SURGERY,  M.CH. NEUROSUGERY",
  "GASTRO": "MS, MCH, DIRECTOR, GI & HPB SURGERY CONSULTANT, LIVER TRANSPLANTATION"
};

export const DOCTOR_DEGREES: Record<string, string> = {
  "Dr. Aashish Agarwal": "MBBS, MD",
  "Dr. Alok Pandey": "MBBS, MS (ENT)",
  "Dr. Anshul Agrawal": "MBBS, MD (Medicine)",
  "Dr. Apurva Agarwal": "MBBS, MD (Paediatrics)",
  "Dr. Ashutosh Mishra": "MBBS, MS, MCh",
  "Dr. Ayush Gupta": "MBBS, MD",
  "Dr. Ayush Pandey": "MBBS, MS (Ortho)",
  "Dr. Devesh Agrawal": "MBBS, MD (Psychiatry)",
  "Dr. Himanshu Dixit": "MBBS, MS (Surgery)",
  "Dr. Jitendra Yadav": "MBBS, DNB",
  "Dr. Kamlesh Agrawal": "MBBS, MS",
  "Dr. Keshav Chandra": "MBBS, MS",
  "Dr. Mahendra Singh": "MBBS, MS",
  "Dr. Mayank Agrawal": "MBBS, MD (Dermatology)",
  "Dr. Mohd Saquib": "MBBS, MS (Ortho)",
  "Dr. Mohd. Waris": "MBBS, MD",
  "Dr. Narendra Singh": "MBBS, MS",
  "Dr. Neelima Agrawal": "MBBS, DGO",
  "Dr. Nipun Agrawal": "MBBS, MS",
  "Dr. O.P. Chaurasia": "MBBS, MD",
  "Dr. Parul Agrawal": "MBBS, MD",
  "Dr. Pradeep Maurya": "MBBS, MS",
  "Dr. Pranjul Agrawal": "MBBS, MD (Medicine)",
  "Dr. Prem Shanker": "MBBS, MS",
  "Dr. R.A. Verma": "MBBS, MS (Surgery)",
  "Dr. R.K. Agrawal": "MBBS, MS",
  "Dr. R.K. Gupta": "MBBS, MS",
  "Dr. Rajesh Agrawal": "MBBS, MS",
  "Dr. Rajiv Goyal": "MBBS, MD",
  "Dr. Rajni Kant": "MBBS, MS",
  "Dr. Rakesh Agrawal": "MBBS, MS",
  "Dr. S.K. Agrawal": "MBBS, MS",
  "Dr. S.K. Gupta": "MBBS, MS",
  "Dr. Sanjeev Gupta": "MBBS, MS",
  "Dr. Sarvesh Mishra": "MBBS, MD",
  "Dr. Satish Chandra": "MBBS, MS",
  "Dr. Seema Agrawal": "MBBS, MD",
  "Dr. Shailendra Agrawal": "MBBS, MS",
  "Dr. Sharad Chandra": "MBBS, MS",
  "Dr. Shobhit Agrawal": "MBBS, MD (Medicine)",
  "Dr. Shraddha Agrawal": "MBBS, DGO",
  "Dr. Siddharth Agrawal": "MBBS, MS",
  "Dr. Sneha Agrawal": "MBBS, MD",
  "Dr. Srishti Agrawal": "MBBS, MD",
  "Dr. Sudeep Kumar": "MBBS, MD",
  "Dr. Sushil Kumar": "MBBS, MS",
  "Dr. Umesh Pandey": "MBBS, MS",
  "Dr. Vipul Agrawal": "MBBS, MD",
  
  // Updated doctors with correct degrees
  "DR. HEMANT KHAJJA": "M.S. ORTHO/ KNEE SPECIALIST",
  "DR. LALITA SUWALKA": "M.SC & phD IN FOOD & NUTRITION",
  "DR. MILIND KIRIT AKHANI": "MS, MCH, DIRECTOR, GI & HPB SURGERY CONSULTANT, LIVER TRANSPLANTATION",
  "DR MEETU BABLE": "MBBS, MS, MENOPAUSE SPECIALIST CONSULTANT - OBSTRETRICS & GYNAECOLOGY",
  "DR. AMIT PATANVADIYA": "MD. DNB. (Neurology)",
  "DR. KISHAN PATEL": "MS, MCH, ( UROLOGY & KIDNEY TRANSPLANT), CONSULTANT UROLOGIST LAPAROSCOPIC & ROBOTIC UROSURGEON",
  "DR. PARTH SHAH": "MBBS,DNB (GEN. SURGERY),DRNB (SURGICSAL ONCOLOGY) CONSULTANT CANCER SURGEONE",
  "DR.RAJEEDP GUPTA": "MD, DNB (MEDICAL ONCOLOGY)",
  "DR. KULDDEP VALA": "M.S GENERAL SURGERY,  M.CH. NEUROSUGERY",
  "DR. KURNAL PATEL": "M.S.GENERAL SUIRGERY, M.CH UROLOGY",
  "DR. SAURABH GUPTA": "MBBS, MD MEDICINE MRCP Endocrinology (UK)",
  "DR. BATUL PEEPAWALA": "MBBS ( RNT MEDICAL COLLEGE)"
};

/**
 * Get doctor's degree by name
 * @param doctorName - Full doctor name (e.g., "Dr. Aashish Agarwal")
 * @returns Doctor's degree string or null if not found
 */
export const getDoctorDegree = (doctorName: string): string | null => {
  if (!doctorName) return null;
  
  const degree = DOCTOR_DEGREES[doctorName];
  if (!degree) {
    console.warn(`⚠️ Doctor degree not found for: "${doctorName}"`);
    return null;
  }
  
  return degree;
};

/**
 * Get formatted doctor name with degree
 * @param doctorName - Full doctor name
 * @returns Object with name and degree separated
 */
export const getDoctorWithDegree = (doctorName: string): { name: string; degree: string | null } => {
  return {
    name: doctorName,
    degree: getDoctorDegree(doctorName)
  };
};