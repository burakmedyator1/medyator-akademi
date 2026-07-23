import { API_URL } from '@/config';
import { getToken } from './storage';

/**
 * frontend/src/api/client.js'in mobil portu. Tek farklar:
 *  - Relative `/api` yerine mutlak API_URL tabanı.
 *  - getToken() async (SecureStore).
 *  - Dosya yüklemeleri File yerine RN asset {uri,name,type} alır.
 */

export type UploadAsset = { uri: string; name: string; type: string };

type RequestOptions = {
  method?: string;
  body?: any;
  auth?: boolean;
};

async function request(path: string, { method = 'GET', body, auth = false }: RequestOptions = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || 'Bir hata oluştu');
  }
  return data;
}

// Çok parçalı (multipart) yükleme: verilen field'a RN asset ekler.
async function upload(path: string, field: string, asset: UploadAsset) {
  const token = await getToken();
  const formData = new FormData();
  // RN FormData dosya için {uri, name, type} bekler.
  formData.append(field, { uri: asset.uri, name: asset.name, type: asset.type } as any);
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || 'Yükleme başarısız');
  return data;
}

/** /uploads/... göreli yolunu mutlak URL'e çevirir (Image source için). */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const api = {
  register: (payload: any) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload: any) => request('/auth/login', { method: 'POST', body: payload }),

  getCourses: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/courses${query ? `?${query}` : ''}`);
  },
  getCourse: (id: string | number) => request(`/courses/${id}`),
  enroll: (id: string | number) => request(`/courses/${id}/enroll`, { method: 'POST', auth: true }),
  getEnrollment: (id: string | number) => request(`/courses/${id}/enrollment`, { auth: true }),
  getLessonVideo: (courseId: string | number, lessonId: string | number) =>
    request(`/courses/${courseId}/lessons/${lessonId}/video`, { auth: true }),
  completeLesson: (courseId: string | number, lessonId: string | number) =>
    request(`/courses/${courseId}/lessons/${lessonId}/complete`, { method: 'POST', auth: true }),

  getInstructors: () => request('/instructors'),
  getInstructor: (id: string | number) => request(`/instructors/${id}`),

  getTestimonials: () => request('/testimonials'),

  getDashboard: () => request('/me/dashboard', { auth: true }),
  changePassword: (payload: any) => request('/me/password', { method: 'PUT', body: payload, auth: true }),
  getProfile: () => request('/me/profile', { auth: true }),
  updateProfile: (payload: any) => request('/me/profile', { method: 'PUT', body: payload, auth: true }),
  deleteAccount: () => request('/me/account', { method: 'DELETE', auth: true }),
  registerPushToken: (token: string) => request('/push/token', { method: 'POST', body: { token }, auth: true }),

  sendContact: (payload: any) => request('/contact', { method: 'POST', body: payload }),

  getSettings: () => request('/settings'),

  getBlogPosts: () => request('/blog'),
  getBlogPost: (slug: string) => request(`/blog/${slug}`),

  getMyQuestions: () => request('/questions/mine', { auth: true }),
  askQuestion: (payload: any) => request('/questions', { method: 'POST', body: payload, auth: true }),
  sendQuestionMessage: (id: string | number, messageText: string) =>
    request(`/questions/${id}/messages`, { method: 'POST', body: { messageText }, auth: true }),

  applyInstructor: (payload: any) =>
    request('/applications/instructor', { method: 'POST', body: payload }),
  applyIntern: async (formData: FormData) => {
    const res = await fetch(`${API_URL}/api/applications/intern`, { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as any).error || 'Başvuru gönderilemedi');
    return data;
  },

  instructor: {
    getQuestions: () => request('/instructor/questions', { auth: true }),
    sendQuestionMessage: (id: string | number, messageText: string) =>
      request(`/instructor/questions/${id}/messages`, { method: 'POST', body: { messageText }, auth: true }),
    getBlogPosts: () => request('/instructor/blog', { auth: true }),
    createBlogPost: (payload: any) =>
      request('/instructor/blog', { method: 'POST', body: payload, auth: true }),
    uploadBlogCover: (asset: UploadAsset) => upload('/instructor/blog/cover', 'cover', asset),
  },

  admin: {
    getCourses: () => request('/admin/courses', { auth: true }),
    createCourse: (payload: any) => request('/admin/courses', { method: 'POST', body: payload, auth: true }),
    updateCourse: (id: string | number, payload: any) =>
      request(`/admin/courses/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteCourse: (id: string | number) => request(`/admin/courses/${id}`, { method: 'DELETE', auth: true }),
    uploadCourseCover: (asset: UploadAsset) => upload('/admin/courses/cover', 'cover', asset),

    getLessons: (courseId: string | number) => request(`/admin/courses/${courseId}/lessons`, { auth: true }),
    createLesson: (courseId: string | number, payload: any) =>
      request(`/admin/courses/${courseId}/lessons`, { method: 'POST', body: payload, auth: true }),
    updateLesson: (courseId: string | number, id: string | number, payload: any) =>
      request(`/admin/courses/${courseId}/lessons/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteLesson: (courseId: string | number, id: string | number) =>
      request(`/admin/courses/${courseId}/lessons/${id}`, { method: 'DELETE', auth: true }),

    getCategories: () => request('/admin/categories', { auth: true }),
    createCategory: (payload: any) => request('/admin/categories', { method: 'POST', body: payload, auth: true }),
    updateCategory: (id: string | number, payload: any) =>
      request(`/admin/categories/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteCategory: (id: string | number) => request(`/admin/categories/${id}`, { method: 'DELETE', auth: true }),

    getTestimonials: () => request('/admin/testimonials', { auth: true }),
    createTestimonial: (payload: any) =>
      request('/admin/testimonials', { method: 'POST', body: payload, auth: true }),
    updateTestimonial: (id: string | number, payload: any) =>
      request(`/admin/testimonials/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteTestimonial: (id: string | number) =>
      request(`/admin/testimonials/${id}`, { method: 'DELETE', auth: true }),
    uploadTestimonialPhoto: (asset: UploadAsset) => upload('/admin/testimonials/photo', 'photo', asset),

    getInstructors: () => request('/admin/instructors', { auth: true }),
    createInstructor: (payload: any) =>
      request('/admin/instructors', { method: 'POST', body: payload, auth: true }),
    updateInstructor: (id: string | number, payload: any) =>
      request(`/admin/instructors/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteInstructor: (id: string | number) => request(`/admin/instructors/${id}`, { method: 'DELETE', auth: true }),
    resetInstructorPassword: (id: string | number) =>
      request(`/admin/instructors/${id}/reset-password`, { method: 'POST', auth: true }),
    uploadInstructorPhoto: (asset: UploadAsset) => upload('/admin/instructors/photo', 'photo', asset),

    getStudents: () => request('/admin/students', { auth: true }),
    getStudent: (id: string | number) => request(`/admin/students/${id}`, { auth: true }),
    enrollStudent: (id: string | number, payload: any) =>
      request(`/admin/students/${id}/enroll`, { method: 'POST', body: payload, auth: true }),
    resetStudentPassword: (id: string | number) =>
      request(`/admin/students/${id}/reset-password`, { method: 'POST', auth: true }),
    updateEnrollment: (id: string | number, payload: any) =>
      request(`/admin/enrollments/${id}`, { method: 'PATCH', body: payload, auth: true }),

    getOrders: () => request('/admin/orders', { auth: true }),
    sendOrderReminder: (id: string | number) =>
      request(`/admin/orders/${id}/remind`, { method: 'POST', auth: true }),

    getContactRequests: () => request('/admin/contact-requests', { auth: true }),

    getQuestions: () => request('/admin/questions', { auth: true }),

    getOverview: () => request('/admin/overview', { auth: true }),

    getNotifications: () => request('/admin/notifications', { auth: true }),
    sendNotification: (payload: any) => request('/admin/notifications', { method: 'POST', body: payload, auth: true }),

    getApplications: () => request('/admin/applications', { auth: true }),
    deleteApplication: (id: string | number) => request(`/admin/applications/${id}`, { method: 'DELETE', auth: true }),

    getBlogPosts: () => request('/admin/blog', { auth: true }),
    createBlogPost: (payload: any) => request('/admin/blog', { method: 'POST', body: payload, auth: true }),
    updateBlogPost: (id: string | number, payload: any) =>
      request(`/admin/blog/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteBlogPost: (id: string | number) => request(`/admin/blog/${id}`, { method: 'DELETE', auth: true }),
    setBlogPostStatus: (id: string | number, status: string) =>
      request(`/admin/blog/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
    uploadBlogCover: (asset: UploadAsset) => upload('/admin/blog/cover', 'cover', asset),

    getSettings: () => request('/admin/settings', { auth: true }),
    updateSettings: (payload: any) => request('/admin/settings', { method: 'PUT', body: payload, auth: true }),

    uploadLogo: (asset: UploadAsset) => upload('/admin/settings/logo', 'logo', asset),
    uploadLogoDark: (asset: UploadAsset) => upload('/admin/settings/logo-dark', 'logo', asset),
    uploadSplashImage: (asset: UploadAsset) => upload('/admin/settings/splash-image', 'splashImage', asset),
  },
};
