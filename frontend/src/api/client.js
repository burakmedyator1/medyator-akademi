const TOKEN_KEY = 'medyator_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Bir hata oluştu');
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  getCourses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/courses${query ? `?${query}` : ''}`);
  },
  getCourse: (id) => request(`/courses/${id}`),
  enroll: (id) => request(`/courses/${id}/enroll`, { method: 'POST', auth: true }),
  getLessonVideo: (courseId, lessonId) =>
    request(`/courses/${courseId}/lessons/${lessonId}/video`, { auth: true }),

  getInstructors: () => request('/instructors'),
  getInstructor: (id) => request(`/instructors/${id}`),

  getDashboard: () => request('/me/dashboard', { auth: true }),
  changePassword: (payload) => request('/me/password', { method: 'PUT', body: payload, auth: true }),

  sendContact: (payload) => request('/contact', { method: 'POST', body: payload }),

  getSettings: () => request('/settings'),

  getBlogPosts: () => request('/blog'),
  getBlogPost: (slug) => request(`/blog/${slug}`),

  getMyQuestions: () => request('/questions/mine', { auth: true }),
  askQuestion: (payload) => request('/questions', { method: 'POST', body: payload, auth: true }),

  instructor: {
    getQuestions: () => request('/instructor/questions', { auth: true }),
    answerQuestion: (id, answerText) =>
      request(`/instructor/questions/${id}`, { method: 'PATCH', body: { answerText }, auth: true }),

    getBlogPosts: () => request('/instructor/blog', { auth: true }),
    createBlogPost: (payload) => request('/instructor/blog', { method: 'POST', body: payload, auth: true }),
    uploadBlogCover: async (file) => {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await fetch('/api/instructor/blog/cover', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
      return data;
    },
  },

  applyInstructor: (payload) => request('/applications/instructor', { method: 'POST', body: payload }),
  applyIntern: async (formData) => {
    const res = await fetch('/api/applications/intern', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Başvuru gönderilemedi');
    return data;
  },

  admin: {
    getCourses: () => request('/admin/courses', { auth: true }),
    createCourse: (payload) => request('/admin/courses', { method: 'POST', body: payload, auth: true }),
    updateCourse: (id, payload) =>
      request(`/admin/courses/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteCourse: (id) => request(`/admin/courses/${id}`, { method: 'DELETE', auth: true }),
    uploadCourseCover: async (file) => {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await fetch('/api/admin/courses/cover', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
      return data;
    },

    getLessons: (courseId) => request(`/admin/courses/${courseId}/lessons`, { auth: true }),
    createLesson: (courseId, payload) =>
      request(`/admin/courses/${courseId}/lessons`, { method: 'POST', body: payload, auth: true }),
    updateLesson: (courseId, id, payload) =>
      request(`/admin/courses/${courseId}/lessons/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteLesson: (courseId, id) =>
      request(`/admin/courses/${courseId}/lessons/${id}`, { method: 'DELETE', auth: true }),

    getCategories: () => request('/admin/categories', { auth: true }),
    createCategory: (payload) => request('/admin/categories', { method: 'POST', body: payload, auth: true }),
    updateCategory: (id, payload) =>
      request(`/admin/categories/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE', auth: true }),

    getInstructors: () => request('/admin/instructors', { auth: true }),
    createInstructor: (payload) =>
      request('/admin/instructors', { method: 'POST', body: payload, auth: true }),
    updateInstructor: (id, payload) =>
      request(`/admin/instructors/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteInstructor: (id) => request(`/admin/instructors/${id}`, { method: 'DELETE', auth: true }),
    resetInstructorPassword: (id) =>
      request(`/admin/instructors/${id}/reset-password`, { method: 'POST', auth: true }),
    uploadInstructorPhoto: async (file) => {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/admin/instructors/photo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
      return data;
    },

    getStudents: () => request('/admin/students', { auth: true }),
    getStudent: (id) => request(`/admin/students/${id}`, { auth: true }),
    enrollStudent: (id, payload) =>
      request(`/admin/students/${id}/enroll`, { method: 'POST', body: payload, auth: true }),
    resetStudentPassword: (id, newPassword) =>
      request(`/admin/students/${id}/reset-password`, { method: 'POST', body: { newPassword }, auth: true }),
    updateEnrollment: (id, payload) =>
      request(`/admin/enrollments/${id}`, { method: 'PATCH', body: payload, auth: true }),

    getContactRequests: () => request('/admin/contact-requests', { auth: true }),

    getApplications: () => request('/admin/applications', { auth: true }),
    deleteApplication: (id) => request(`/admin/applications/${id}`, { method: 'DELETE', auth: true }),

    getBlogPosts: () => request('/admin/blog', { auth: true }),
    createBlogPost: (payload) => request('/admin/blog', { method: 'POST', body: payload, auth: true }),
    updateBlogPost: (id, payload) =>
      request(`/admin/blog/${id}`, { method: 'PUT', body: payload, auth: true }),
    deleteBlogPost: (id) => request(`/admin/blog/${id}`, { method: 'DELETE', auth: true }),
    setBlogPostStatus: (id, status) =>
      request(`/admin/blog/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
    uploadBlogCover: async (file) => {
      const formData = new FormData();
      formData.append('cover', file);
      const res = await fetch('/api/admin/blog/cover', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
      return data;
    },

    getSettings: () => request('/admin/settings', { auth: true }),
    updateSettings: (payload) =>
      request('/admin/settings', { method: 'PUT', body: payload, auth: true }),

    downloadBackup: async () => {
      const res = await fetch('/api/admin/backup', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Yedek indirilemedi');
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : 'medyator-akademi-yedek.db';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },

    uploadLogo: async (file) => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch('/api/admin/settings/logo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');
      return data;
    },
  },
};
