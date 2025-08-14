// Google Drive Integration for Hospital CRM Backup
// This module handles authentication and file operations with Google Drive

export interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  scope: string;
  discoveryDocs: string[];
}

// Google Drive API configuration
const GOOGLE_DRIVE_CONFIG: GoogleDriveConfig = {
  clientId: '', // Will be set by user
  apiKey: '', // Will be set by user
  scope: 'https://www.googleapis.com/auth/drive.file',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};

// Load Google API client library
export const loadGoogleDriveAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      (window as any).gapi.load('client:auth2', () => {
        resolve();
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// Initialize Google Drive client
export const initGoogleDriveClient = async (clientId: string, apiKey: string): Promise<boolean> => {
  try {
    const gapi = (window as any).gapi;
    
    await gapi.client.init({
      apiKey: apiKey,
      clientId: clientId,
      discoveryDocs: GOOGLE_DRIVE_CONFIG.discoveryDocs,
      scope: GOOGLE_DRIVE_CONFIG.scope
    });
    
    return true;
  } catch (error) {
    console.error('Error initializing Google Drive client:', error);
    return false;
  }
};

// Sign in to Google Drive
export const signInToGoogleDrive = async (): Promise<{ email: string; name: string } | null> => {
  try {
    const gapi = (window as any).gapi;
    const authInstance = gapi.auth2.getAuthInstance();
    
    if (!authInstance.isSignedIn.get()) {
      await authInstance.signIn();
    }
    
    const user = authInstance.currentUser.get();
    const profile = user.getBasicProfile();
    
    return {
      email: profile.getEmail(),
      name: profile.getName()
    };
  } catch (error) {
    console.error('Error signing in to Google Drive:', error);
    return null;
  }
};

// Upload backup file to Google Drive
export const uploadToGoogleDrive = async (
  fileName: string,
  fileContent: string,
  mimeType: string = 'application/json'
): Promise<{ id: string; webViewLink: string } | null> => {
  try {
    const gapi = (window as any).gapi;
    
    // Check if signed in
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      console.error('Not signed in to Google Drive');
      return null;
    }
    
    // Create file metadata
    const fileMetadata = {
      name: fileName,
      mimeType: mimeType,
      parents: ['root'] // Save to root directory, can be changed to specific folder
    };
    
    // Create the file content
    const file = new Blob([fileContent], { type: mimeType });
    
    // Create form data
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    formData.append('file', file);
    
    // Upload file
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + gapi.auth.getToken().access_token
      },
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        id: data.id,
        webViewLink: data.webViewLink
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return null;
  }
};

// List backup files from Google Drive
export const listGoogleDriveBackups = async (): Promise<any[]> => {
  try {
    const gapi = (window as any).gapi;
    
    // Check if signed in
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      console.error('Not signed in to Google Drive');
      return [];
    }
    
    const response = await gapi.client.drive.files.list({
      q: "name contains 'valant-hospital-backup'",
      orderBy: 'createdTime desc',
      fields: 'files(id, name, createdTime, size, webViewLink)',
      pageSize: 10
    });
    
    return response.result.files || [];
  } catch (error) {
    console.error('Error listing Google Drive backups:', error);
    return [];
  }
};

// Download backup file from Google Drive
export const downloadFromGoogleDrive = async (fileId: string): Promise<string | null> => {
  try {
    const gapi = (window as any).gapi;
    
    // Check if signed in
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance.isSignedIn.get()) {
      console.error('Not signed in to Google Drive');
      return null;
    }
    
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media'
    });
    
    return response.body;
  } catch (error) {
    console.error('Error downloading from Google Drive:', error);
    return null;
  }
};

// Sign out from Google Drive
export const signOutFromGoogleDrive = async (): Promise<void> => {
  try {
    const gapi = (window as any).gapi;
    const authInstance = gapi.auth2.getAuthInstance();
    
    if (authInstance && authInstance.isSignedIn.get()) {
      await authInstance.signOut();
    }
  } catch (error) {
    console.error('Error signing out from Google Drive:', error);
  }
};

// Check if Google API is loaded
export const isGoogleAPILoaded = (): boolean => {
  return typeof (window as any).gapi !== 'undefined';
};

// Check if user is signed in to Google Drive
export const isSignedInToGoogleDrive = (): boolean => {
  try {
    const gapi = (window as any).gapi;
    if (!gapi || !gapi.auth2) return false;
    
    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance ? authInstance.isSignedIn.get() : false;
  } catch {
    return false;
  }
};