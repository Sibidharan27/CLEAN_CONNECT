import { authRequest, uploadRequest, API_URL } from './api';

export const getComplaints = () => authRequest('/complaints');

export const getComplaintById = (id) => authRequest(`/complaints/${id}`);

export const getComplaintStats = () => authRequest('/complaints/stats');

export async function createComplaint({ category, description, address, latitude, longitude, imageUri }) {
  const formData = new FormData();
  formData.append('category', category);
  formData.append('description', description);
  formData.append('address', address || '');
  formData.append('latitude', String(latitude || 0));
  formData.append('longitude', String(longitude || 0));

  if (imageUri) {
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('images', { uri: imageUri, name: filename, type });
  }

  return uploadRequest('/complaints', formData);
}

export const updateComplaintStatus = (id, status, resolutionNote) =>
  authRequest(`/complaints/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, resolutionNote }),
  });

export const getImageUrl = (imagePath) => `${API_URL.replace('/api', '')}${imagePath}`;
