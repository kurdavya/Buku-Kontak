// State
let contacts = [];
let filteredContacts = [];
let editingId = null;
let deletingId = null;
let detailId = null;

// DOM Elements
const contactsList = document.getElementById('contactsList');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const searchInput = document.getElementById('searchInput');
const addContactBtn = document.getElementById('addContactBtn');
const emptyAddBtn = document.getElementById('emptyAddBtn');
const totalContacts = document.getElementById('totalContacts');
const totalCount = document.getElementById('totalCount');
const showingStart = document.getElementById('showingStart');
const showingEnd = document.getElementById('showingEnd');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');

const contactModal = document.getElementById('contactModal');
const detailModal = document.getElementById('detailModal');
const deleteModal = document.getElementById('deleteModal');
const contactForm = document.getElementById('contactForm');
const detailContent = document.getElementById('detailContent');

// API Base URL
const API_BASE = '/api/contacts';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadContacts();
  setupEventListeners();
});

function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    filterContacts(e.target.value);
  });

  // Rail Home Navigation
  const railHomeBtn = document.getElementById('railHomeBtn');
  if (railHomeBtn) {
    railHomeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      searchInput.value = '';
      loadContacts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Add Contact
  addContactBtn.addEventListener('click', () => openAddModal());
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openAddModal());

  // Modal Controls
  document.getElementById('closeModalBtn').addEventListener('click', closeContactModal);
  document.getElementById('cancelBtn').addEventListener('click', closeContactModal);
  document.getElementById('closeDetailModalBtn').addEventListener('click', closeDetailModal);
  document.getElementById('closeDeleteModalBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

  // Detail Actions
  document.getElementById('editFromDetailBtn').addEventListener('click', () => {
    closeDetailModal();
    openEditModal(detailId);
  });
  document.getElementById('deleteFromDetailBtn').addEventListener('click', () => {
    closeDetailModal();
    openDeleteModal(detailId);
  });

  // Form Submit
  contactForm.addEventListener('submit', handleSubmit);

  // Escape Key to Close Modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContactModal();
      closeDetailModal();
      closeDeleteModal();
    }
  });

  // Table row action click delegation
  contactsList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);
    if (!id) return;
    if (action === 'detail') openDetailModal(id);
    else if (action === 'edit') openEditModal(id);
    else if (action === 'delete') openDeleteModal(id);
  });

  // Click Outside to Close Modals
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', () => {
      closeContactModal();
      closeDetailModal();
      closeDeleteModal();
    });
  });
}

// API Functions
async function loadContacts() {
  try {
    showLoadingState();
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('Gagal memuat kontak');
    }
    contacts = await response.json();
    const query = searchInput.value.trim();
    if (query) {
      filterContacts(query);
    } else {
      filteredContacts = [...contacts];
      renderContacts();
    }
    updateTotal();
  } catch (error) {
    showErrorState();
  }
}

async function createContact(data) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal menyimpan kontak');
  }
  return response.json();
}

async function updateContact(id, data) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal memperbarui kontak');
  }
  return response.json();
}

async function deleteContact(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal menghapus kontak');
  }
  return true;
}

// UI State Functions
function showLoadingState() {
  loadingState.classList.remove('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
  contactsList.innerHTML = '';

  // Show skeleton rows
  loadingState.innerHTML = Array(3).fill(0).map(() => `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 animate-pulse">
      <div class="md:col-span-4 h-4 bg-matte-1 rounded"></div>
      <div class="md:col-span-3 h-4 bg-matte-1 rounded"></div>
      <div class="md:col-span-3 h-4 bg-matte-1 rounded"></div>
      <div class="md:col-span-2 h-4 bg-matte-1 rounded"></div>
    </div>
  `).join('');
}

function showEmptyState() {
  emptyState.classList.remove('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  contactsList.innerHTML = '';
  updatePagination();
}

function showErrorState() {
  errorState.classList.remove('hidden');
  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  contactsList.innerHTML = '';
  updatePagination();
}

function hideAllStates() {
  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
}

// Render Functions
function renderContacts() {
  if (filteredContacts.length === 0) {
    showEmptyState();
    return;
  }

  hideAllStates();
  contactsList.innerHTML = filteredContacts.map((contact) => `
    <div class="table-row grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center transition-colors" data-id="${Number(contact.id)}">
      <div class="md:col-span-4">
        <div class="flex items-center gap-3">
          <div class="avatar w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0">
            ${escapeHtml(getInitials(contact.nama))}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium truncate">${escapeHtml(contact.nama)}</p>
          </div>
        </div>
      </div>
      <div class="md:col-span-3">
        <p class="text-sm mono truncate">${escapeHtml(contact.no_hp)}</p>
      </div>
      <div class="md:col-span-3">
        <p class="text-sm text-gray-600 truncate">${escapeHtml(contact.email)}</p>
      </div>
      <div class="md:col-span-2 flex justify-end gap-1">
        <button
          type="button"
          data-action="detail"
          data-id="${Number(contact.id)}"
          class="btn-icon rounded-lg p-2"
          aria-label="Lihat detail ${escapeHtml(contact.nama)}"
          title="Detail"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button
          type="button"
          data-action="edit"
          data-id="${Number(contact.id)}"
          class="btn-icon rounded-lg p-2"
          aria-label="Edit ${escapeHtml(contact.nama)}"
          title="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button
          type="button"
          data-action="delete"
          data-id="${Number(contact.id)}"
          class="btn-icon btn-danger rounded-lg p-2"
          aria-label="Hapus ${escapeHtml(contact.nama)}"
          title="Hapus"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  updatePagination();
}

function getInitials(name) {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Filter Function
function filterContacts(query) {
  const search = query.toLowerCase().trim();
  if (!search) {
    filteredContacts = [...contacts];
  } else {
    filteredContacts = contacts.filter((contact) =>
      contact.nama.toLowerCase().includes(search) ||
      contact.no_hp.includes(search) ||
      contact.email.toLowerCase().includes(search)
    );
  }
  renderContacts();
}

// Modal Functions
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Tambah Kontak';
  contactForm.reset();
  clearValidationErrors();
  contactModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function openEditModal(id) {
  editingId = id;
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return;

  document.getElementById('modalTitle').textContent = 'Edit Kontak';
  document.getElementById('namaInput').value = contact.nama;
  document.getElementById('noHpInput').value = contact.no_hp;
  document.getElementById('emailInput').value = contact.email;
  document.getElementById('alamatInput').value = contact.alamat;
  clearValidationErrors();
  contactModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeContactModal() {
  contactModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  editingId = null;
}

function openDetailModal(id) {
  detailId = id;
  const contact = contacts.find((c) => c.id === id);
  if (!contact) return;

  detailContent.innerHTML = `
    <div class="flex items-center gap-4 pb-4 border-b border-matte-1">
      <div class="avatar w-16 h-16 rounded-full flex items-center justify-center text-lg flex-shrink-0">
        ${escapeHtml(getInitials(contact.nama))}
      </div>
      <div>
        <h3 class="text-xl font-bold">${escapeHtml(contact.nama)}</h3>
      </div>
    </div>
    <div class="space-y-3">
      <div>
        <p class="text-xs mono text-gray-500 uppercase mb-1">No. HP</p>
        <p class="text-sm mono">${escapeHtml(contact.no_hp)}</p>
      </div>
      <div>
        <p class="text-xs mono text-gray-500 uppercase mb-1">Email</p>
        <p class="text-sm">${escapeHtml(contact.email)}</p>
      </div>
      <div>
        <p class="text-xs mono text-gray-500 uppercase mb-1">Alamat</p>
        <p class="text-sm">${escapeHtml(contact.alamat)}</p>
      </div>
    </div>
  `;
  detailModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeDetailModal() {
  detailModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  detailId = null;
}

function openDeleteModal(id) {
  deletingId = id;
  deleteModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  document.body.classList.remove('modal-open');
  deletingId = null;
}

// Form Submit Handler
async function handleSubmit(e) {
  e.preventDefault();
  clearValidationErrors();

  const formData = {
    nama: document.getElementById('namaInput').value.trim(),
    no_hp: document.getElementById('noHpInput').value.trim(),
    email: document.getElementById('emailInput').value.trim(),
    alamat: document.getElementById('alamatInput').value.trim(),
  };

  if (!validateForm(formData)) {
    return;
  }

  try {
    if (editingId) {
      await updateContact(editingId, formData);
      showToast('success', 'Kontak berhasil diperbarui');
    } else {
      await createContact(formData);
      showToast('success', 'Kontak berhasil ditambahkan');
    }
    closeContactModal();
    await loadContacts();
  } catch (error) {
    showToast('error', error.message);
  }
}

// Validation
function validateForm(data) {
  let isValid = true;

  if (!data.nama) {
    showError('nama', 'Nama lengkap wajib diisi');
    isValid = false;
  } else if (data.nama.length > 100) {
    showError('nama', 'Nama maksimal 100 karakter');
    isValid = false;
  }

  if (!data.no_hp) {
    showError('noHp', 'No. HP wajib diisi');
    isValid = false;
  } else if (!/^[0-9]{10,15}$/.test(data.no_hp)) {
    showError('noHp', 'No. HP harus berisi 10-15 digit angka');
    isValid = false;
  }

  if (!data.email) {
    showError('email', 'Email wajib diisi');
    isValid = false;
  } else if (data.email.length > 100) {
    showError('email', 'Email maksimal 100 karakter');
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    showError('email', 'Format email tidak valid');
    isValid = false;
  }

  if (!data.alamat) {
    showError('alamat', 'Alamat wajib diisi');
    isValid = false;
  } else if (data.alamat.length > 1000) {
    showError('alamat', 'Alamat maksimal 1000 karakter');
    isValid = false;
  }

  return isValid;
}

function showError(field, message) {
  const input = document.getElementById(`${field}Input`);
  const error = document.getElementById(`${field}Error`);
  if (input) input.classList.add('border-red-500');
  if (error) {
    error.textContent = message;
    error.classList.remove('hidden');
  }
}

function clearValidationErrors() {
  const fields = ['nama', 'noHp', 'email', 'alamat'];
  fields.forEach((field) => {
    const input = document.getElementById(`${field}Input`);
    const error = document.getElementById(`${field}Error`);
    if (input) input.classList.remove('border-red-500');
    if (error) {
      error.textContent = '';
      error.classList.add('hidden');
    }
  });
}

// Confirm Delete
async function confirmDelete() {
  if (!deletingId) return;

  try {
    await deleteContact(deletingId);
    showToast('success', 'Kontak berhasil dihapus');
    closeDeleteModal();
    await loadContacts();
  } catch (error) {
    showToast('error', error.message);
  }
}

// Toast Notifications
function showToast(type, message) {
  const toast = document.createElement('div');
  toast.className = `toast ${type} px-4 py-3 text-sm`;
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const container = document.getElementById('toastContainer');
  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Update Total Contacts
function updateTotal() {
  totalContacts.textContent = contacts.length;
  totalCount.textContent = contacts.length;
}

// Pagination
function updatePagination() {
  const start = filteredContacts.length > 0 ? 1 : 0;
  const end = filteredContacts.length;
  if (showingStart) showingStart.textContent = start;
  if (showingEnd) showingEnd.textContent = end;
  if (totalCount) totalCount.textContent = filteredContacts.length;

  if (prevPageBtn) prevPageBtn.disabled = true;
  if (nextPageBtn) nextPageBtn.disabled = true;
}

// Utility Functions
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Error Retry Button
document.getElementById('retryBtn')?.addEventListener('click', () => {
  loadContacts();
});