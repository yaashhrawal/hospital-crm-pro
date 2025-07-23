// Doctor Degree Mapping for Prescription Templates
// Maps doctor names to their medical degrees

export interface DoctorDegree {
  name: string;
  degree: string;
}

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
  
  // Legacy doctors from the existing system (if they exist)
  "DR. HEMANT KHAJJA": "MBBS, MS (Ortho)",
  "DR. LALITA SUWALKA": "MBBS, MD (Nutrition)",
  "DR. MILIND KIRIT AKHANI": "MBBS, MD (Gastro)",
  "DR MEETU BABLE": "MBBS, DGO",
  "DR. AMIT PATANVADIYA": "MBBS, MD (Neurology)",
  "DR. KISHAN PATEL": "MBBS, MS (Urology)",
  "DR. PARTH SHAH": "MBBS, MS, MCh (Surgical Oncology)",
  "DR.RAJEEDP GUPTA": "MBBS, MD (Medical Oncology)",
  "DR. KULDDEP VALA": "MBBS, MS, MCh (Neurosurgery)",
  "DR. KURNAL PATEL": "MBBS, MS (Urology)",
  "DR. SAURABH GUPTA": "MBBS, MD (Endocrinology)",
  "DR. BATUL PEEPAWALA": "MBBS, MD (General Medicine)"
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