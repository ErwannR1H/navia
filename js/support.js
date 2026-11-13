(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const priorityDetails = {
    critical: { label: 'Crítica', estimate: 'Atención inmediata' },
    high: { label: 'Alta', estimate: 'Atención en un máximo de 24 horas' },
    medium: { label: 'Media', estimate: 'Resolución estimada de 2 a 5 días hábiles' },
    low: { label: 'Baja', estimate: 'Resolución estimada de 5 a 10 días hábiles' }
  };
  const categoryPriority = {
    platform_outage: 'critical',
    data_security: 'critical',
    academic_recommendation: 'high',
    academic_history: 'high',
    visual_issue: 'low'
  };
  const categoryNames = {
    platform_outage: 'Caída de Navia',
    data_security: 'Seguridad o pérdida de datos',
    academic_recommendation: 'Recomendación académica',
    academic_history: 'Historial académico',
    login: 'Acceso',
    functionality: 'Funcionalidad',
    visual_issue: 'Problema visual',
    community_content: 'Contenido de comunidad',
    other: 'Otra consulta'
  };

  let currentTicketId = null;
  let adminTicketId = null;
  let academicSaveTimer = null;
  let currentUserProfile = null;
  let guestModeSelected = false;
  let signedOutDestination = 1;

  function client() {
    if (!window.naviaSupabase) throw new Error(window.naviaBackendError?.message || 'Supabase no está configurado. Sigue la guía de configuración del proyecto.');
    return window.naviaSupabase;
  }
  window.naviaScheduleAcademicSave = scheduleAcademicSave;

  function user() {
    return window.naviaCurrentUser || null;
  }

  function requireUser() {
    if (!user()) throw new Error('Inicia sesión con tu cuenta de Navia para usar esta función.');
  }

  function isAdmin() {
    return currentUserProfile?.role === 'admin';
  }
  window.naviaIsAdmin = isAdmin;

  function showActionError(error) {
    console.error(error);
    showToast(error.message || 'No se pudo completar la operación.');
  }

  async function signIn(email, password) {
    const supabase = await window.naviaBackendReady;
    if (!supabase) throw new Error(window.naviaBackendError?.message || 'No se pudo conectar con Supabase. Revisa la configuración del proyecto.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    guestModeSelected = false;
    signedOutDestination = 1;
    closeMicrosoftLogin();

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('id,email,role,display_name,student_code,career,cycle,goal')
      .eq('id', data.user.id).maybeSingle();
    if (profileError) {
      await supabase.auth.signOut();
      throw profileError;
    }
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('Tu cuenta aún no está habilitada por el administrador de Navia.');
    }

    window.naviaCurrentUser = data.user;
    currentUserProfile = profile;
    document.getElementById('microsoftAccountBadge').classList.remove('hidden');
    updateRoleNavigation();
    await restoreAccount(profile);
    if (isAdmin()) {
      goToScreen(17);
      await Promise.all([loadTickets(), loadModerationDashboard(), loadAdminComplaints()]);
    } else {
      await Promise.all([loadTickets(), loadCommunityPosts()]);
    }
    return profile;
  }

  async function restoreExistingSession(session) {
    if (!session?.user || guestModeSelected) return;
    const supabase = client();
    const { data: profile, error } = await supabase
      .from('profiles').select('id,email,role,display_name,student_code,career,cycle,goal')
      .eq('id', session.user.id).maybeSingle();
    if (error) throw error;
    if (guestModeSelected) return;
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('Tu cuenta no tiene un perfil de Navia activo.');
    }

    window.naviaCurrentUser = session.user;
    currentUserProfile = profile;
    document.getElementById('microsoftAccountBadge').classList.remove('hidden');
    updateRoleNavigation();
    await restoreAccount(profile);
    if (guestModeSelected) {
      window.naviaCurrentUser = null;
      currentUserProfile = null;
      window.naviaResetStudentProfile?.();
      document.getElementById('microsoftAccountBadge').classList.add('hidden');
      document.getElementById('studentEmailLabel').textContent = 'alumno@usil.pe';
      updateRoleNavigation();
      goToScreen(signedOutDestination);
      return;
    }
    if (isAdmin()) {
      goToScreen(17);
      await Promise.all([loadTickets(), loadModerationDashboard(), loadAdminComplaints()]);
    } else {
      await Promise.all([loadTickets(), loadCommunityPosts()]);
    }
  }

  async function signOut(destination = 1) {
    if (destination !== 2 && user() && !isAdmin()) await persistAcademicState();
    guestModeSelected = true;
    signedOutDestination = destination;
    const { error } = await client().auth.signOut();
    if (error) {
      guestModeSelected = false;
      throw error;
    }
    window.naviaCurrentUser = null;
    currentUserProfile = null;
    window.naviaResetStudentProfile?.();
    document.getElementById('microsoftAccountBadge').classList.add('hidden');
    document.getElementById('studentEmailLabel').textContent = 'alumno@usil.pe';
    closeUserMenu();
    updateRoleNavigation();
    goToScreen(destination);
    if (destination === 1) showToast('Sesión cerrada.');
  }

  function updateRoleNavigation() {
    const isSignedIn = Boolean(user());
    const adminOnly = isAdmin();
    $('#userMenuToggle')?.classList.toggle('hidden', !isSignedIn);
    ['adminNavButton', 'adminMobileNavButton'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', !adminOnly);
    });
    document.querySelectorAll('#innerAppNav .nav-tab:not([data-view="17"])').forEach(button => {
      button.classList.toggle('hidden', adminOnly);
    });
    document.querySelectorAll('#innerMobileMenu .nav-tab:not([data-view="17"])').forEach(button => {
      button.classList.toggle('hidden', adminOnly);
    });
    document.querySelector('#innerMobileMenu > button:not([data-view])')?.classList.toggle('hidden', adminOnly);
    document.querySelector('.nv-inner-menu-toggle')?.classList.toggle('hidden', adminOnly);
    const userMenuProfile = document.querySelector('#userMenu [role="menuitem"]:first-child');
    if (userMenuProfile) userMenuProfile.classList.toggle('hidden', adminOnly);
    const helpButton = document.querySelector('.nv-help-fab');
    if (helpButton) helpButton.classList.toggle('hidden', adminOnly);
    $('#appFooter')?.classList.toggle('hidden', adminOnly);
    const signOutButton = document.getElementById('signOutButton');
    if (signOutButton) signOutButton.classList.toggle('hidden', !isSignedIn);
    document.querySelectorAll('.support-tab[data-support-tab="moderation"]').forEach(button => {
      button.classList.toggle('hidden', !adminOnly);
    });
  }

  async function persistProfile(profile) {
    if (!user()) return;
    const { error } = await client().rpc('set_student_profile', {
      p_display_name: profile.name,
      p_student_code: profile.code || null,
      p_career: profile.career,
      p_cycle: Number(profile.cycle),
      p_goal: profile.goal
    });
    if (error) throw error;
    currentUserProfile = { ...currentUserProfile, ...profile };
    await persistAcademicState();
  }

  async function persistAcademicState() {
    if (!user() || !profileCompleted) return;
    const state = {
      checkedCourses: $$('.hist-check:checked').map(input => input.dataset.course).filter(Boolean),
      selectedLoadCount,
      selectedRouteCourses: [...selectedRouteCourses],
      plannedCourses: [...plannedCourses],
      routeCustomized,
      dynamicDiagnosticScore,
      quizAnswers: [...quizAnswers],
      currentQuizIndex,
      diagWrongCourses: [...diagWrongCourses],
      diagCorrect,
      diagTotal,
      closureAnswers: [...closureAnswers],
      closureScore,
      closureQuizIndex,
      closureQuestions: [...closureQuestions],
      closureStatuses: getClosureCourses().map(row => row.status),
      closureApplied,
      lastClosure: lastClosure ? { ...lastClosure, rows: lastClosure.rows.map(row => ({ ...row })) } : null
    };
    const { error } = await client().from('student_data').upsert({
      user_id: user().id,
      academic_state: state,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  }

  function scheduleAcademicSave() {
    if (!user() || !profileCompleted) return;
    clearTimeout(academicSaveTimer);
    academicSaveTimer = setTimeout(() => persistAcademicState().catch(showActionError), 500);
  }

  async function restoreAccount(profile) {
    studentProfile = {
      ...studentProfile,
      email: profile.email || user().email,
      name: profile.display_name || '',
      code: profile.student_code || '',
      career: profile.career || '',
      cycle: profile.cycle ? String(profile.cycle) : '',
      goal: profile.goal || 'Ninguno'
    };
    document.getElementById('studentEmailLabel').textContent = studentProfile.email;
    document.getElementById('studentName').value = studentProfile.name;
    document.getElementById('studentCode').value = studentProfile.code;
    document.getElementById('userCareer').value = studentProfile.career;
    previewSelectedCareer();
    document.getElementById('userCurrentCycle').value = studentProfile.cycle;
    profileCompleted = Boolean(profile.career && profile.cycle);
    if (profileCompleted) {
      renderDynamicCurriculum();
      const { data, error } = await client().from('student_data')
        .select('academic_state').eq('user_id', user().id).maybeSingle();
      if (error) throw error;
      const state = data?.academic_state || {};
      const approved = new Set(state.checkedCourses || []);
      $$('.hist-check').forEach(input => { input.checked = approved.has(input.dataset.course); });
      selectedLoadCount = Number(state.selectedLoadCount) || 0;
      selectedRouteCourses = Array.isArray(state.selectedRouteCourses) ? state.selectedRouteCourses : [];
      plannedCourses = Array.isArray(state.plannedCourses) ? state.plannedCourses : [];
      routeCustomized = Boolean(state.routeCustomized);
      dynamicDiagnosticScore = Number.isFinite(state.dynamicDiagnosticScore) ? state.dynamicDiagnosticScore : null;
      quizAnswers = Array.isArray(state.quizAnswers) ? state.quizAnswers : [];
      currentQuizIndex = Number(state.currentQuizIndex) || 0;
      diagWrongCourses = Array.isArray(state.diagWrongCourses) ? state.diagWrongCourses : [];
      diagCorrect = Number(state.diagCorrect) || 0;
      diagTotal = Number(state.diagTotal) || 0;
      closureAnswers = Array.isArray(state.closureAnswers) ? state.closureAnswers : [];
      closureScore = Number(state.closureScore) || 0;
      closureQuizIndex = Number(state.closureQuizIndex) || 0;
      closureQuestions = Array.isArray(state.closureQuestions) ? state.closureQuestions : [];
      closureApplied = Boolean(state.closureApplied);
      lastClosure = state.lastClosure && typeof state.lastClosure === 'object' ? state.lastClosure : null;
      renderLoadOptions();
      renderSuggestedCourses();
      renderCourseConcepts();
      renderClosureRows();
      getClosureCourses().forEach((row, index) => {
        const select = $$('.cierre-status-select')[index];
        if (select && state.closureStatuses?.[index]) select.value = state.closureStatuses[index];
      });
      $$('.cierre-status-select').forEach(adjustStatusColor);
      updateDashboardFromProfile();
      updateHistoryCounts();
      updateNavigationAccess();
      goToScreen(4);
    } else {
      updateNavigationAccess();
      goToScreen(2);
    }
  }

  window.naviaSignIn = signIn;
  window.naviaSignOut = () => signOut().catch(showActionError);
  window.naviaPersistProfile = persistProfile;
  window.naviaPersistAcademicState = persistAcademicState;

  window.showSupportTab = function (tab) {
    if (tab === 'moderation' && !isAdmin()) {
      showToast('Esta sección está reservada al equipo administrador.');
      return;
    }
    if (tab === 'tickets' || tab === 'complaint') {
      goToScreen(16);
      $$('.support-tab').forEach(button => button.classList.toggle('active', button.dataset.supportTab === tab));
      $('#supportTicketsPanel').classList.toggle('hidden', tab !== 'tickets');
      $('#supportComplaintPanel').classList.toggle('hidden', tab !== 'complaint');
    }
  };

  window.closeUserMenu = function () {
    const menu = $('#userMenu');
    const toggle = $('#userMenuToggle');
    menu?.classList.add('hidden');
    toggle?.setAttribute('aria-expanded', 'false');
  };

  function toggleUserMenu() {
    const menu = $('#userMenu');
    const toggle = $('#userMenuToggle');
    const willOpen = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !willOpen);
    toggle.setAttribute('aria-expanded', String(willOpen));
  }

  window.updateTicketSla = function () {
    const category = $('#ticketCategory').value;
    const priority = categoryPriority[category] || 'medium';
    const details = priorityDetails[priority];
    $('#ticketSlaMessage').textContent = category
      ? `Prioridad ${details.label.toLowerCase()}. ${details.estimate}, según el SLA propuesto.`
      : 'Elige una categoría para ver el plazo estimado según el SLA.';
  };

  function formatDate(value) {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  function statusLabel(status) {
    return ({ open: 'Abierto', in_progress: 'En curso', closed: 'Cerrado' })[status] || status;
  }

  async function loadTickets() {
    if (!user()) return;
    const { data, error } = await client().from('tickets').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    renderTicketList(data || []);
    if (isAdmin()) renderAdminTicketList(data || []);
  }

  function renderTicketList(tickets) {
    const host = $('#ticketList');
    if (!tickets.length) {
      host.innerHTML = '<p class="text-sm text-slate-500">Aún no tienes tickets.</p>';
      return;
    }
    host.replaceChildren(...tickets.map(ticket => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'w-full rounded-xl border border-slate-200 p-3 text-left hover:border-blue-400';
      button.innerHTML = `<span class="block text-sm font-bold text-slate-800">${escapeHtml(ticket.subject)}</span><span class="mt-1 block text-xs text-slate-500">${escapeHtml(statusLabel(ticket.status))} · ${escapeHtml(priorityDetails[ticket.priority]?.label || ticket.priority)} · ${escapeHtml(formatDate(ticket.updated_at))}</span>`;
      button.addEventListener('click', () => openTicket(ticket));
      return button;
    }));
  }

  function renderAdminTicketList(tickets) {
    const host = $('#adminTicketList');
    const closedHost = $('#adminClosedTicketList');
    if (!host) return;
    const pending = tickets.filter(ticket => ticket.status !== 'closed');
    const closed = tickets.filter(ticket => ticket.status === 'closed');
    if (!pending.length) {
      host.innerHTML = '<p class="text-sm text-slate-500">No hay tickets abiertos.</p>';
    } else {
      renderAdminTicketCards(host, pending);
    }
    if (closedHost) {
      if (!closed.length) closedHost.innerHTML = '<p class="text-sm text-slate-500">No hay tickets cerrados.</p>';
      else renderAdminTicketCards(closedHost, closed);
    }
  }

  function renderAdminTicketCards(host, tickets) {
    host.replaceChildren(...tickets.map(ticket => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'w-full rounded-xl border border-slate-200 p-3 text-left hover:border-blue-400';
      button.innerHTML = `<span class="block text-sm font-bold">${escapeHtml(ticket.subject)}</span><span class="mt-1 block text-xs text-slate-500">${escapeHtml(categoryNames[ticket.category])} · ${escapeHtml(priorityDetails[ticket.priority]?.label || ticket.priority)} · ${escapeHtml(statusLabel(ticket.status))}</span>`;
      button.addEventListener('click', () => openAdminTicket(ticket));
      return button;
    }));
  }

  function renderMessages(host, messages, ticket) {
    host.replaceChildren();
    if (!messages.length) {
      host.innerHTML = '<p class="text-sm text-slate-500">Sé el primero en responder a este ticket.</p>';
      return;
    }
    messages.forEach(message => {
      const article = document.createElement('article');
      article.className = `rounded-xl p-3 ${message.author_id === ticket.owner_id ? 'bg-blue-50' : 'bg-slate-100'}`;
      const author = message.author_id === ticket.owner_id ? 'Estudiante' : 'Soporte Navia';
      article.innerHTML = `<div class="flex justify-between gap-3"><strong class="text-xs text-[#003366]">${author}</strong><time class="text-[10px] text-slate-500">${escapeHtml(formatDate(message.created_at))}</time></div><p class="mt-2 whitespace-pre-wrap text-sm text-slate-700">${escapeHtml(message.body)}</p>`;
      host.append(article);
    });
    host.scrollTop = host.scrollHeight;
  }

  async function fetchMessages(ticket) {
    const { data, error } = await client().from('ticket_messages').select('*')
      .eq('ticket_id', ticket.id).order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function openTicket(ticket) {
    try {
      currentTicketId = ticket.id;
      const messages = await fetchMessages(ticket);
      $('#ticketThreadEmpty').classList.add('hidden');
      $('#ticketThread').classList.remove('hidden');
      $('#ticketThreadSubject').textContent = ticket.subject;
      $('#ticketThreadMeta').textContent = `#${ticket.id.slice(0, 8)} · ${categoryNames[ticket.category]} · ${priorityDetails[ticket.priority]?.estimate} · ${statusLabel(ticket.status)}`;
      renderMessages($('#ticketMessages'), messages, ticket);
      await renderTicketAttachment(ticket, $('#ticketThreadMeta'));
      $('#ticketReplyForm').classList.toggle('hidden', ticket.status === 'closed');
      $('#ticketCloseButton').classList.toggle('hidden', ticket.status === 'closed' || isAdmin());
      $('#ticketReplyForm').onsubmit = event => sendReply(event, ticket, $('#ticketReply'));
    } catch (error) {
      showActionError(error);
    }
  }

  async function openAdminTicket(ticket) {
    try {
      adminTicketId = ticket.id;
      const messages = await fetchMessages(ticket);
      $('#adminTicketThread').classList.remove('hidden');
      $('#adminTicketSubject').textContent = ticket.subject;
      $('#adminTicketMeta').textContent = `#${ticket.id.slice(0, 8)} · ${categoryNames[ticket.category]} · ${priorityDetails[ticket.priority]?.estimate}`;
      await renderTicketAttachment(ticket, $('#adminTicketMeta'));
      $('#adminTicketStatus').value = ticket.status;
      $('#adminTicketReplyForm').classList.remove('hidden');
      renderMessages($('#adminTicketMessages'), messages, ticket);
      $('#adminTicketReplyForm').onsubmit = event => sendReply(event, ticket, $('#adminTicketReply'));
      $('#adminTicketThread').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      showActionError(error);
    }
  }

  async function renderTicketAttachment(ticket, meta) {
    meta.querySelector('.ticket-attachment-link')?.remove();
    if (!ticket.attachment_path) return;
    const { data, error } = await client().storage.from('ticket-attachments')
      .createSignedUrl(ticket.attachment_path, 300);
    if (error) throw error;
    const link = document.createElement('a');
    link.className = 'ticket-attachment-link ml-2 underline';
    link.href = data.signedUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Ver adjunto (enlace de 5 min)';
    meta.append(link);
  }

  async function sendReply(event, ticket, input) {
    event.preventDefault();
    const body = input.value.trim();
    if (!body) return;
    try {
      if (isAdmin() && ticket.status === 'closed') {
        const { error: reopenError } = await client().rpc('set_ticket_status', {
          p_ticket_id: ticket.id, p_status: 'in_progress'
        });
        if (reopenError) throw reopenError;
      }
      const { error } = await client().from('ticket_messages').insert({
        ticket_id: ticket.id, author_id: user().id, body
      });
      if (error) throw error;
      input.value = '';
      await loadTickets();
      const { data: refreshed, error: refreshError } = await client().from('tickets').select('*').eq('id', ticket.id).single();
      if (refreshError) throw refreshError;
      if (isAdmin()) await openAdminTicket(refreshed);
      else await openTicket(refreshed);
    } catch (error) {
      showActionError(error);
    }
  }

  async function closeCurrentTicket() {
    try {
      const { error } = await client().rpc('set_ticket_status', { p_ticket_id: currentTicketId, p_status: 'closed' });
      if (error) throw error;
      await loadTickets();
      $('#ticketThread').classList.add('hidden');
      $('#ticketThreadEmpty').classList.remove('hidden');
      showToast('Ticket cerrado.');
    } catch (error) {
      showActionError(error);
    }
  }

  async function setAdminTicketStatus(status) {
    if (!adminTicketId) return;
    try {
      const { error } = await client().rpc('set_ticket_status', { p_ticket_id: adminTicketId, p_status: status });
      if (error) throw error;
      await loadTickets();
      const { data, error: ticketError } = await client().from('tickets').select('*').eq('id', adminTicketId).single();
      if (ticketError) throw ticketError;
      await openAdminTicket(data);
      showToast(`Ticket ${statusLabel(status).toLowerCase()}.`);
    } catch (error) {
      showActionError(error);
    }
  }
  window.closeCurrentTicket = closeCurrentTicket;
  window.setAdminTicketStatus = status => setAdminTicketStatus(status);

  $('#ticketForm').addEventListener('submit', async event => {
    event.preventDefault();
    let createdTicket = null;
    try {
      requireUser();
      const category = $('#ticketCategory').value;
      const subject = $('#ticketSubject').value.trim();
      const description = $('#ticketDescription').value.trim();
      const attachment = $('#ticketAttachment').files[0];
      if (attachment && attachment.size > 5 * 1024 * 1024) throw new Error('El adjunto supera el límite de 5 MB.');
      const { data: createdTicketData, error } = await client().rpc('create_ticket_with_message', {
        p_subject: subject,
        p_category: category,
        p_body: description
      });
      if (error) throw error;
      const ticket = Array.isArray(createdTicketData) ? createdTicketData[0] : createdTicketData;
      if (!ticket?.id) throw new Error('Supabase no devolvió el ticket creado.');
      createdTicket = ticket;
      if (attachment) {
        const path = `${ticket.id}/${crypto.randomUUID()}-${attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadError } = await client().storage.from('ticket-attachments').upload(path, attachment, { upsert: false });
        if (uploadError) throw uploadError;
        const { error: attachError } = await client().rpc('attach_ticket_file', { p_ticket_id: ticket.id, p_path: path });
        if (attachError) throw attachError;
      }
      event.target.reset();
      updateTicketAttachmentLabel();
      updateTicketSla();
      await loadTickets();
      await openTicket(ticket);
      showToast('Ticket publicado. Tu conversación queda guardada.');
    } catch (error) {
      if (createdTicket) {
        try {
          await loadTickets();
          await openTicket(createdTicket);
          showToast(`Ticket guardado, pero el adjunto no pudo añadirse: ${error.message}`);
        } catch (refreshError) {
          showActionError(refreshError);
        }
        return;
      }
      showActionError(error);
    }
  });

  function updateTicketAttachmentLabel() {
    const input = $('#ticketAttachment');
    const status = $('#ticketAttachmentStatus');
    if (!input || !status) return;
    status.textContent = input.files.length
      ? `Archivo seleccionado: ${input.files[0].name}`
      : 'Ningún archivo seleccionado.';
  }

  $('#ticketAttachment').addEventListener('change', updateTicketAttachmentLabel);

  $('#ticketReplyForm').addEventListener('submit', event => event.preventDefault());
  $('#adminTicketReplyForm').addEventListener('submit', event => event.preventDefault());

  $('#complaintForm').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      requireUser();
      const formData = new FormData(form);
      const record = Object.fromEntries(formData.entries());
      delete record.accept_copy;
      record.owner_id = user().id;
      const { data, error } = await client().from('complaints').insert(record)
        .select('tracking_code,created_at,consumer_name').single();
      if (error) throw error;
      form.reset();
      showComplaintReceipt({ ...record, ...data });
    } catch (error) {
      showActionError(error);
    }
  });

  function showComplaintReceipt(receipt) {
    const receiptFields = [
      ['Nombre', receipt.consumer_name],
      ['Domicilio', receipt.consumer_address],
      ['Documento', receipt.consumer_document],
      ['Correo', receipt.consumer_email],
      ['Teléfono', receipt.consumer_phone || 'No indicado'],
      ['Tipo', receipt.complaint_type],
      ['Servicio', receipt.service_description],
      ['Detalle', receipt.detail],
      ['Pedido', receipt.request]
    ];
    const printableFields = receiptFields.map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join('');
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4';
    dialog.innerHTML = `<section class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="complaintReceiptTitle"><h2 id="complaintReceiptTitle" class="text-xl font-bold text-[#003366]">Constancia registrada</h2><p class="mt-3 text-sm text-slate-600">Guarda el número de seguimiento. La copia PDF incluirá los datos que presentaste.</p><p class="my-4 rounded-xl bg-blue-50 p-4 text-center text-lg font-black tracking-wide text-blue-900">${escapeHtml(receipt.tracking_code)}</p><p class="text-xs text-slate-500">Fecha: ${escapeHtml(formatDate(receipt.created_at))}</p><div class="mt-3 space-y-2 text-xs text-slate-700">${printableFields}</div><div class="mt-5 flex justify-end gap-2"><button type="button" class="rounded-xl border border-slate-300 px-4 py-2 text-sm" data-close>Volver</button><button type="button" class="rounded-xl bg-[#003366] px-4 py-2 text-sm font-bold text-white" data-print>Imprimir / guardar PDF</button></div></section>`;
    document.body.append(dialog);
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.remove());
    dialog.querySelector('[data-print]').addEventListener('click', () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast('Permite ventanas emergentes para imprimir la constancia.');
        return;
      }
      printWindow.opener = null;
      printWindow.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Constancia ${escapeHtml(receipt.tracking_code)}</title><style>body{font:14px Arial,sans-serif;max-width:720px;margin:40px auto;padding:24px;color:#172554}h1{color:#003366}p{line-height:1.6;white-space:pre-wrap}.code{font-size:24px;font-weight:bold;border:1px solid #ccd5e5;padding:20px;text-align:center}</style><h1>Navia — Copia de presentación</h1><p class="code">${escapeHtml(receipt.tracking_code)}</p><p>Fecha: ${escapeHtml(formatDate(receipt.created_at))}</p>${printableFields}<script>window.onload=()=>window.print()<\/script></html>`);
      printWindow.document.close();
    });
  }

  async function loadCommunityPosts() {
    if (!user()) return;
    const { data, error } = await client().from('community_posts')
      .select('id,author_id,course,body,status,likes,created_at')
      .neq('status', 'hidden').order('created_at', { ascending: false });
    if (error) throw error;
    const postIds = (data || []).map(post => post.id);
    const { data: comments, error: commentsError } = postIds.length
      ? await client().from('community_comments').select('id,post_id,author_id,body,created_at').in('post_id', postIds).order('created_at')
      : { data: [], error: null };
    if (commentsError) throw commentsError;
    const { data: likedRows, error: likesError } = postIds.length
      ? await client().from('community_likes').select('post_id').eq('user_id', user().id).in('post_id', postIds)
      : { data: [], error: null };
    if (likesError) throw likesError;
    const likedPostIds = new Set((likedRows || []).map(row => row.post_id));
    const authorIds = [...new Set([...(data || []).map(post => post.author_id), ...(comments || []).map(comment => comment.author_id)])];
    const authorNames = new Map();
    if (authorIds.length) {
      const { data: authors, error: authorsError } = await client().from('community_public_profiles')
        .select('user_id,display_name,reputation').in('user_id', authorIds);
      if (authorsError) throw authorsError;
      authors.forEach(author => authorNames.set(author.user_id, author));
    }
    const commentsByPost = new Map();
    (comments || []).forEach(comment => {
      if (!commentsByPost.has(comment.post_id)) commentsByPost.set(comment.post_id, []);
      commentsByPost.get(comment.post_id).push(comment);
    });
    const list = $('#commReviewsList');
    data.forEach(post => {
      let item = list.querySelector(`[data-post-id="${post.id}"]`);
      const author = authorNames.get(post.author_id);
      const authorName = author?.display_name || (post.author_id === user().id ? studentProfile.name : 'Estudiante Navia');
      const reputation = author?.reputation || 0;
      item && (item.dataset.communityStatus = post.status);
      if (!item) {
        item = document.createElement('article');
        item.className = 'review-item p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs flex items-start justify-between gap-3';
        item.dataset.postId = post.id;
        item.dataset.authorId = post.author_id;
        item.dataset.communityStatus = post.status;
        item.innerHTML = `<div class="flex items-start gap-3 min-w-0 flex-1"><div class="review-avatar w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">NA</div><div class="post-content-area min-w-0 flex-1"><div class="flex flex-wrap items-baseline gap-2"><span class="review-author font-bold text-xs text-slate-900"></span><span class="review-course text-[10px] text-slate-600"></span><span class="post-badge"></span></div><p class="review-content text-xs text-slate-600 mt-1 leading-relaxed"></p><p class="post-status mt-1 text-[10px] text-slate-500"></p><button type="button" class="report-post mt-2 text-[10px] font-semibold text-red-700 underline">Reportar publicación</button><div class="post-comments mt-3 space-y-2 border-t border-slate-100 pt-3"></div><form class="post-comment-form mt-3 flex gap-2"><label class="sr-only">Escribe un comentario</label><input maxlength="2000" required class="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs" placeholder="Escribe un comentario…"><button type="submit" class="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">Responder</button></form></div></div><button type="button" class="like-btn flex items-center gap-1.5 text-xs text-rose-500 font-semibold bg-rose-50 px-2.5 py-1 rounded-full" aria-label="Me gusta"><span>♡</span><span class="likes-num"></span></button>`;
        item.querySelector('.like-btn').addEventListener('click', () => window.toggleCommentLike(item.querySelector('.like-btn'), post.likes));
        item.querySelector('.report-post').addEventListener('click', () => reportPost(post.id));
        item.querySelector('.post-comment-form').addEventListener('submit', event => addPostComment(event, post.id));
      }
      item.querySelector('.review-author').textContent = authorName;
      item.querySelector('.review-course').textContent = post.course;
      item.querySelector('.review-content').textContent = post.body;
      item.querySelector('.post-status').textContent = ({ discussion: 'En debate', resolved: 'Resuelto', academic_question: 'Pregunta académica' })[post.status] || post.status;
      item.querySelector('.review-avatar').textContent = authorName.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
      item.querySelector('.post-badge').innerHTML = reputation >= 10 ? '<span class="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">Estudiante experto</span>' : '';
      item.dataset.reputation = String(reputation);
      item.querySelector('.like-btn').dataset.liked = String(likedPostIds.has(post.id));
      item.querySelector('.likes-num').textContent = post.likes;
      renderPostComments(item.querySelector('.post-comments'), commentsByPost.get(post.id) || [], authorNames);
      if (!item.isConnected) list.prepend(item);
    });
    filterCommunityItems($('#communitySearchInput')?.value || '');
  }

  function renderPostComments(host, comments, authorNames) {
    host.replaceChildren();
    comments.forEach(comment => {
      const author = authorNames.get(comment.author_id);
      const isOwnComment = comment.author_id === user()?.id;
      const commentCard = document.createElement('div');
      commentCard.className = 'rounded-lg bg-slate-50 p-2.5';
      commentCard.innerHTML = `<div class="flex flex-wrap items-center justify-between gap-2"><div class="flex flex-wrap items-center gap-1"><strong class="text-[10px] text-slate-700">${escapeHtml(author?.display_name || (isOwnComment ? studentProfile.name : 'Estudiante Navia'))}</strong>${isOwnComment ? '<span class="text-[9px] text-slate-500">(Mi mensaje)</span>' : ''}</div><time class="text-[9px] text-slate-500">${escapeHtml(formatDate(comment.created_at))}</time></div><p class="mt-1 whitespace-pre-wrap text-xs text-slate-700"></p><div class="mt-1 flex flex-wrap gap-3"><button type="button" class="report-comment text-[10px] font-semibold text-red-700 underline">Reportar comentario</button>${isOwnComment ? '<button type="button" class="delete-comment text-[10px] font-semibold text-slate-600 underline">Eliminar mi comentario</button>' : ''}</div>`;
      commentCard.querySelector('p').textContent = comment.body;
      commentCard.querySelector('.report-comment').addEventListener('click', () => reportComment(comment.id));
      commentCard.querySelector('.delete-comment')?.addEventListener('click', () => deleteOwnComment(comment.id));
      host.append(commentCard);
    });
  }

  async function deleteOwnComment(commentId) {
    try {
      requireUser();
      if (!window.confirm('¿Eliminar tu comentario?')) return;
      const { error } = await client().from('community_comments')
        .delete().eq('id', commentId).eq('author_id', user().id);
      if (error) throw error;
      await loadCommunityPosts();
      showToast('Comentario eliminado.');
    } catch (error) {
      showActionError(error);
    }
  }

  async function addPostComment(event, postId) {
    event.preventDefault();
    try {
      requireUser();
      const input = event.currentTarget.querySelector('input');
      const body = input.value.trim();
      if (!body) return;
      const { error } = await client().from('community_comments').insert({
        post_id: postId, author_id: user().id, body
      });
      if (error) throw error;
      input.value = '';
      await loadCommunityPosts();
    } catch (error) {
      showActionError(error);
    }
  }

  async function reportPost(postId) {
    await reportCommunityItem({ post_id: postId });
  }

  async function reportComment(commentId) {
    await reportCommunityItem({ comment_id: commentId });
  }

  async function reportCommunityItem(target) {
    try {
      requireUser();
      const reason = window.prompt('¿Por qué reportas este contenido?');
      if (!reason || reason.trim().length < 5) {
        if (reason !== null) showToast('Describe el motivo del reporte (mínimo 5 caracteres).');
        return;
      }
      const { error } = await client().from('community_reports').insert({
        ...target, reporter_id: user().id, reason: reason.trim()
      });
      if (error) throw error;
      showToast('Reporte enviado al equipo de moderación.');
    } catch (error) {
      showActionError(error);
    }
  }

  async function loadModerationDashboard() {
    if (!isAdmin()) return;
    const { data: reports, error } = await client().from('community_reports')
      .select('id,reason,status,created_at,post_id,comment_id,community_posts(id,course,body,author_id,status),community_comments(id,body,post_id,author_id,status)')
      .eq('status', 'pending').order('created_at', { ascending: true });
    if (error) throw error;
    const host = $('#moderationList');
    if (!reports?.length) {
      host.innerHTML = '<p class="text-sm text-slate-500">No hay reportes pendientes.</p>';
      return;
    }
    host.replaceChildren(...reports.map(report => {
      const card = document.createElement('article');
      const post = report.community_posts;
      const comment = report.community_comments;
      card.className = 'rounded-xl border border-slate-200 p-3';
      const reportedText = comment?.body || post?.body || 'Contenido eliminado';
      const itemType = comment ? 'Comentario' : 'Publicación';
      card.innerHTML = `<p class="text-xs font-bold text-red-700">Reporte de ${itemType.toLowerCase()} · ${escapeHtml(formatDate(report.created_at))}</p><p class="mt-2 text-xs text-slate-600">${escapeHtml(report.reason)}</p><p class="mt-2 text-sm text-slate-800">${escapeHtml(reportedText)}</p><p class="mt-1 text-[10px] text-slate-500">${escapeHtml(post?.course || '')}</p><div class="mt-3 flex gap-2"><button type="button" data-action="dismiss" class="rounded-lg border border-slate-300 px-3 py-2 text-xs">Descartar</button><button type="button" data-action="hide" class="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white">Ocultar ${itemType.toLowerCase()}</button></div>`;
      card.querySelector('[data-action="dismiss"]').addEventListener('click', () => moderateReport(report, false));
      card.querySelector('[data-action="hide"]').addEventListener('click', () => moderateReport(report, true));
      return card;
    }));
  }

  async function loadAdminComplaints() {
    if (!isAdmin()) return;
    const { data, error } = await client().from('complaints')
      .select('id,tracking_code,consumer_name,consumer_email,consumer_phone,service_description,complaint_type,detail,request,created_at,status')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const host = $('#adminComplaintList');
    if (!data?.length) {
      host.innerHTML = '<p class="text-sm text-slate-500">Aún no se han recibido reclamaciones.</p>';
      return;
    }
    const complaintIds = data.map(complaint => complaint.id);
    const { data: messages, error: messagesError } = await client().from('complaint_messages')
      .select('id,complaint_id,author_id,body,created_at')
      .in('complaint_id', complaintIds).order('created_at');
    if (messagesError) throw messagesError;
    const messagesByComplaint = new Map();
    (messages || []).forEach(message => {
      if (!messagesByComplaint.has(message.complaint_id)) messagesByComplaint.set(message.complaint_id, []);
      messagesByComplaint.get(message.complaint_id).push(message);
    });
    host.replaceChildren(...data.map(complaint => {
      const card = document.createElement('article');
      card.className = 'rounded-xl border border-slate-200 p-3';
      card.innerHTML = `<p class="text-xs font-bold text-blue-800">${escapeHtml(complaint.tracking_code)} · ${escapeHtml(complaint.complaint_type)}</p><p class="mt-1 text-[10px] text-slate-500">${escapeHtml(formatDate(complaint.created_at))}</p><p class="mt-2 text-sm font-bold">${escapeHtml(complaint.consumer_name)}</p><p class="text-xs text-slate-600">${escapeHtml(complaint.consumer_email)} ${escapeHtml(complaint.consumer_phone || '')}</p><p class="mt-2 text-xs"><strong>Servicio:</strong> ${escapeHtml(complaint.service_description)}</p><p class="mt-2 whitespace-pre-wrap text-xs text-slate-700">${escapeHtml(complaint.detail)}</p><p class="mt-2 whitespace-pre-wrap text-xs"><strong>Pedido:</strong> ${escapeHtml(complaint.request)}</p><label class="mt-3 block text-xs font-semibold">Estado<select class="complaint-status mt-1 w-full rounded-lg border border-slate-300 p-2" aria-label="Estado de ${escapeHtml(complaint.tracking_code)}"><option value="open">Abierta</option><option value="in_progress">En curso</option><option value="closed">Cerrada</option></select></label><div class="complaint-messages my-3 space-y-2 border-t border-slate-100 pt-3"></div><form class="complaint-reply-form flex flex-col gap-2"><label class="sr-only">Respuesta a ${escapeHtml(complaint.tracking_code)}</label><textarea required maxlength="10000" rows="2" class="min-w-0 rounded-xl border border-slate-300 p-3 text-sm" placeholder="Responder a la reclamación…"></textarea><button type="submit" class="self-end rounded-xl bg-[#003366] px-4 py-2 text-sm font-bold text-white">Enviar respuesta</button></form>`;
      const status = card.querySelector('.complaint-status');
      status.value = complaint.status || 'open';
      status.addEventListener('change', () => setComplaintStatus(complaint, status.value));
      const messageHost = card.querySelector('.complaint-messages');
      const complaintMessages = messagesByComplaint.get(complaint.id) || [];
      if (complaintMessages.length) {
        complaintMessages.forEach(message => {
          const entry = document.createElement('article');
          entry.className = 'rounded-lg bg-slate-50 p-2.5';
          entry.innerHTML = `<div class="flex justify-between gap-2"><strong class="text-[10px] text-[#003366]">Administración Navia</strong><time class="text-[9px] text-slate-500">${escapeHtml(formatDate(message.created_at))}</time></div><p class="mt-1 whitespace-pre-wrap text-xs text-slate-700">${escapeHtml(message.body)}</p>`;
          messageHost.append(entry);
        });
      } else {
        messageHost.innerHTML = '<p class="text-xs text-slate-500">Sin respuestas administrativas.</p>';
      }
      card.querySelector('.complaint-reply-form').addEventListener('submit', event =>
        sendComplaintReply(event, complaint, card.querySelector('textarea')));
      return card;
    }));
  }

  async function setComplaintStatus(complaint, status) {
    try {
      const { error } = await client().from('complaints').update({ status }).eq('id', complaint.id);
      if (error) throw error;
      showToast(`Reclamación ${statusLabel(status).toLowerCase()}.`);
    } catch (error) {
      showActionError(error);
      await loadAdminComplaints();
    }
  }

  async function sendComplaintReply(event, complaint, input) {
    event.preventDefault();
    const body = input.value.trim();
    if (!body) return;
    try {
      if (complaint.status === 'closed') {
        const { error: statusError } = await client().from('complaints')
          .update({ status: 'in_progress' }).eq('id', complaint.id);
        if (statusError) throw statusError;
      }
      const { error } = await client().from('complaint_messages').insert({
        complaint_id: complaint.id, author_id: user().id, body
      });
      if (error) throw error;
      await loadAdminComplaints();
      showToast('Respuesta enviada a la reclamación.');
    } catch (error) {
      showActionError(error);
    }
  }

  async function moderateReport(report, hidePost) {
    try {
      if (hidePost) {
        const table = report.comment_id ? 'community_comments' : 'community_posts';
        const id = report.comment_id || report.post_id;
        const { error: postError } = await client().from(table).update({ status: 'hidden' }).eq('id', id);
        if (postError) throw postError;
      }
      const { error } = await client().from('community_reports')
        .update({ status: hidePost ? 'reviewed' : 'dismissed' }).eq('id', report.id);
      if (error) throw error;
      await loadModerationDashboard();
      showToast(hidePost ? 'Contenido ocultado.' : 'Reporte descartado.');
    } catch (error) {
      showActionError(error);
    }
  }

  window.handleReviewSubmit = async function (event) {
    event.preventDefault();
    try {
      requireUser();
      const course = $('#reviewCourse').value;
      const body = $('#reviewContent').value.trim();
      if (!course || !body) throw new Error('Selecciona un curso y escribe tu opinión.');
      const { data: post, error } = await client().from('community_posts').insert({
        author_id: user().id, course, body,
        status: $('#reviewStatus')?.value || 'discussion'
      }).select('id').single();
      if (error) throw error;
      closeLeaveReviewModal();
      $('#reviewContent').value = '';
      await loadCommunityPosts();
      showToast('¡Tu opinión se publicó en la comunidad!');
      if (post) document.querySelector(`[data-post-id="${post.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      showActionError(error);
    }
  };

  window.toggleCommentLike = async function (button, baseCount) {
    if (!button.closest('[data-post-id]')) {
      const liked = button.dataset.liked === 'true';
      button.dataset.liked = String(!liked);
      button.querySelector('.likes-num').textContent = String(Number(button.querySelector('.likes-num').textContent) + (liked ? -1 : 1));
      return;
    }
    try {
      requireUser();
      const postId = button.closest('[data-post-id]').dataset.postId;
      const { data: count, error } = await client().rpc('toggle_community_like', { p_post_id: postId });
      if (error) throw error;
      button.dataset.liked = String(button.dataset.liked !== 'true');
      button.querySelector('.likes-num').textContent = count;
      const item = button.closest('.review-item');
      const { data: author, error: authorError } = await client().from('community_public_profiles')
        .select('reputation').eq('user_id', item.dataset.authorId).single();
      if (authorError) throw authorError;
      item.dataset.reputation = String(author.reputation);
      item.querySelector('.post-badge').innerHTML = author.reputation >= 10
        ? '<span class="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700">Estudiante experto</span>'
        : '';
    } catch (error) {
      showActionError(error);
    }
  };

  function addCommunityStatusField() {
    const form = $('#reviewModal form');
    if (!form || $('#reviewStatus')) return;
    const field = document.createElement('label');
    field.className = 'block text-xs font-bold text-slate-700';
    field.textContent = 'Tipo de publicación';
    const select = document.createElement('select');
    select.id = 'reviewStatus';
    select.className = 'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs';
    [
      ['discussion', 'En debate'],
      ['resolved', 'Resuelto'],
      ['academic_question', 'Pregunta académica']
    ].forEach(([value, label]) => select.add(new Option(label, value)));
    field.append(select);
    form.querySelector('.pt-2')?.before(field);
  }

  function attachReportControls() {
    $$('#commReviewsList .review-item').forEach(item => {
      if (item.dataset.postId || item.querySelector('.report-post')) return;
      const content = item.querySelector('p');
      if (!content) return;
      const authorRow = content.parentElement;
      const notice = document.createElement('span');
      notice.className = 'ml-2 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600';
      notice.textContent = 'Contenido de ejemplo';
      authorRow.append(notice);
    });
  }

  async function initializeSupport() {
    addCommunityStatusField();
    attachReportControls();
    $('#userMenuToggle').addEventListener('click', toggleUserMenu);
    document.addEventListener('click', event => {
      if (!event.target.closest('#userMenu, #userMenuToggle')) closeUserMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeUserMenu();
    });
    updateRoleNavigation();
    if (window.naviaBackendReady) {
      window.naviaBackendReady.then(() => {
        window.naviaSupabase.auth.onAuthStateChange((event, session) => {
          if (event === 'INITIAL_SESSION' && session) {
            queueMicrotask(() => restoreExistingSession(session).catch(showActionError));
          } else if (event === 'SIGNED_OUT') {
            window.naviaCurrentUser = null;
            currentUserProfile = null;
            window.naviaResetStudentProfile?.();
            $('#microsoftAccountBadge').classList.add('hidden');
            $('#studentEmailLabel').textContent = 'alumno@usil.pe';
            updateRoleNavigation();
          }
        });
      }).catch(error => {
        window.naviaBackendError = error;
        console.error(error);
      });
    }
    const reviewList = $('#commReviewsList');
    new MutationObserver(attachReportControls).observe(reviewList, { childList: true });
    document.getElementById('mainContent').addEventListener('change', event => {
      if (event.target.closest('#screen-5, #screen-6, #screen-7, #screen-8, #screen-9, #screen-10, #screen-11')) scheduleAcademicSave();
    });
    document.getElementById('mainContent').addEventListener('click', event => {
      if (event.target.closest('#screen-5, #screen-6, #screen-7, #screen-8, #screen-9, #screen-10, #screen-11')) scheduleAcademicSave();
    });
    const originalGoToScreen = window.goToScreen;
    window.goToScreen = function (screenNumber) {
      originalGoToScreen(screenNumber);
      if (screenNumber === 16 && user()) loadTickets().catch(showActionError);
      if (screenNumber === 17 && isAdmin()) {
        Promise.all([loadTickets(), loadModerationDashboard(), loadAdminComplaints()]).catch(showActionError);
      }
      if ([3, 5, 6, 7, 8, 9, 10, 11, 12, 13].includes(screenNumber)) scheduleAcademicSave();
    };
  }

  window.signOutNaviaUser = () => signOut().catch(showActionError);
  window.continueAsGuest = async function () {
    try {
      if (user()) {
        await signOut(2);
        return;
      }
      guestModeSelected = true;
      signedOutDestination = 2;
      if (window.naviaBackendReady) {
        try {
          const supabase = await window.naviaBackendReady;
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (data.session) {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
          }
        } catch (error) {
          if (!window.naviaBackendError) throw error;
        }
      }
      window.naviaCurrentUser = null;
      currentUserProfile = null;
      window.naviaResetStudentProfile?.();
      document.getElementById('microsoftAccountBadge').classList.add('hidden');
      document.getElementById('studentEmailLabel').textContent = 'alumno@usil.pe';
      updateRoleNavigation();
      goToScreen(2);
    } catch (error) {
      showActionError(error);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeSupport);
  else initializeSupport();
})();
