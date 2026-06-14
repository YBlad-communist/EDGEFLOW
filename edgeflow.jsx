// ═══════════════════════════════════════════════════════════════
//  EDGEFLOW — Биржа живых знаний
//  Полная логика приложения. Дизайн не включён.
//  Структура:
//    1. Константы и конфиги
//    2. Хранилище (Store) — всё состояние приложения
//    3. Движки (Engines) — бизнес-логика
//    4. Хуки (Hooks) — интерфейс между логикой и UI
//    5. UI компоненты — голые, без стилей
//    6. Роутер / Root
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useReducer, useRef, createContext, useContext } from "react";

// ───────────────────────────────────────────
//  1. КОНСТАНТЫ
// ───────────────────────────────────────────

const COMMISSION_RATE = 0.15;          // 15% платформа берёт с каждой транзакции
const PRO_MONTHLY_PRICE = 19;          // $19/мес про-аккаунт
const VERIFICATION_PRICE = 30;         // $30 верификация навыка
const CORPORATE_BASE_PRICE = 500;      // $500/мес минимальный корпоративный пакет
const MAX_GROUP_SIZE = 20;             // максимум учеников в групповом курсе
const BARTER_EXPIRY_DAYS = 30;         // бартерный оффер живёт 30 дней
const SESSION_BUFFER_MINUTES = 15;     // буфер между сессиями в календаре

const SESSION_TYPES = {
  ONE_ON_ONE: "one_on_one",       // живая 1:1 сессия
  GROUP: "group",                 // групповой курс
  ASYNC: "async",                 // асинхронный курс (записи)
  MASTERMIND: "mastermind",       // мастермайнд группа
  BARTER: "barter",              // бартер без денег
};

const USER_ROLES = {
  STUDENT: "student",
  EXPERT: "expert",
  BOTH: "both",
};

const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
};

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

const VERIFICATION_STATUS = {
  UNVERIFIED: "unverified",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

// ───────────────────────────────────────────
//  2. НАЧАЛЬНОЕ СОСТОЯНИЕ + REDUCER
// ───────────────────────────────────────────

const initialState = {
  // Текущий пользователь
  currentUser: null,

  // Все пользователи (в реале — API)
  users: {},

  // Все курсы и сессии
  listings: {},

  // Бронирования
  bookings: {},

  // Бартерные офферы
  barterOffers: {},

  // Транзакции
  transactions: {},

  // Чаты
  chats: {},

  // Уведомления
  notifications: {},

  // Верификации навыков
  verifications: {},

  // Корпоративные аккаунты
  corporateAccounts: {},

  // Глобальный поиск / фильтры
  searchState: {
    query: "",
    category: null,
    sessionType: null,
    priceMin: 0,
    priceMax: 999,
    rating: 0,
    language: null,
    availability: null,
    verifiedOnly: false,
  },

  // UI состояние
  ui: {
    activeTab: "discover",       // discover | my_learning | my_teaching | barter | profile | corporate
    activeModal: null,
    loading: {},
    errors: {},
  },
};

function appReducer(state, action) {
  switch (action.type) {

    // ── Пользователи ──
    case "SET_CURRENT_USER":
      return { ...state, currentUser: action.payload };

    case "UPDATE_USER":
      return {
        ...state,
        users: { ...state.users, [action.payload.id]: { ...state.users[action.payload.id], ...action.payload } },
        currentUser: state.currentUser?.id === action.payload.id
          ? { ...state.currentUser, ...action.payload }
          : state.currentUser,
      };

    case "ADD_USER":
      return { ...state, users: { ...state.users, [action.payload.id]: action.payload } };

    // ── Листинги ──
    case "ADD_LISTING":
      return { ...state, listings: { ...state.listings, [action.payload.id]: action.payload } };

    case "UPDATE_LISTING":
      return {
        ...state,
        listings: { ...state.listings, [action.payload.id]: { ...state.listings[action.payload.id], ...action.payload } },
      };

    case "DELETE_LISTING": {
      const { [action.payload]: _, ...rest } = state.listings;
      return { ...state, listings: rest };
    }

    // ── Бронирования ──
    case "ADD_BOOKING":
      return { ...state, bookings: { ...state.bookings, [action.payload.id]: action.payload } };

    case "UPDATE_BOOKING":
      return {
        ...state,
        bookings: { ...state.bookings, [action.payload.id]: { ...state.bookings[action.payload.id], ...action.payload } },
      };

    // ── Бартер ──
    case "ADD_BARTER_OFFER":
      return { ...state, barterOffers: { ...state.barterOffers, [action.payload.id]: action.payload } };

    case "UPDATE_BARTER_OFFER":
      return {
        ...state,
        barterOffers: { ...state.barterOffers, [action.payload.id]: { ...state.barterOffers[action.payload.id], ...action.payload } },
      };

    // ── Транзакции ──
    case "ADD_TRANSACTION":
      return { ...state, transactions: { ...state.transactions, [action.payload.id]: action.payload } };

    // ── Чаты ──
    case "ADD_CHAT":
      return { ...state, chats: { ...state.chats, [action.payload.id]: action.payload } };

    case "ADD_MESSAGE": {
      const chat = state.chats[action.payload.chatId];
      if (!chat) return state;
      return {
        ...state,
        chats: {
          ...state.chats,
          [action.payload.chatId]: {
            ...chat,
            messages: [...chat.messages, action.payload.message],
            updatedAt: new Date().toISOString(),
          },
        },
      };
    }

    // ── Уведомления ──
    case "ADD_NOTIFICATION":
      return { ...state, notifications: { ...state.notifications, [action.payload.id]: action.payload } };

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: {
          ...state.notifications,
          [action.payload]: { ...state.notifications[action.payload], read: true },
        },
      };

    // ── Верификации ──
    case "ADD_VERIFICATION":
      return { ...state, verifications: { ...state.verifications, [action.payload.id]: action.payload } };

    case "UPDATE_VERIFICATION":
      return {
        ...state,
        verifications: { ...state.verifications, [action.payload.id]: { ...state.verifications[action.payload.id], ...action.payload } },
      };

    // ── Корпоратив ──
    case "ADD_CORPORATE_ACCOUNT":
      return { ...state, corporateAccounts: { ...state.corporateAccounts, [action.payload.id]: action.payload } };

    // ── Поиск ──
    case "SET_SEARCH_STATE":
      return { ...state, searchState: { ...state.searchState, ...action.payload } };

    // ── UI ──
    case "SET_ACTIVE_TAB":
      return { ...state, ui: { ...state.ui, activeTab: action.payload } };

    case "SET_ACTIVE_MODAL":
      return { ...state, ui: { ...state.ui, activeModal: action.payload } };

    case "SET_LOADING":
      return { ...state, ui: { ...state.ui, loading: { ...state.ui.loading, [action.payload.key]: action.payload.value } } };

    case "SET_ERROR":
      return { ...state, ui: { ...state.ui, errors: { ...state.ui.errors, [action.payload.key]: action.payload.value } } };

    case "CLEAR_ERROR": {
      const { [action.payload]: __, ...restErrors } = state.ui.errors;
      return { ...state, ui: { ...state.ui, errors: restErrors } };
    }

    default:
      return state;
  }
}

// ───────────────────────────────────────────
//  CONTEXT
// ───────────────────────────────────────────

const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

// ───────────────────────────────────────────
//  3. ДВИЖКИ (чистые функции бизнес-логики)
// ───────────────────────────────────────────

// ── ID Generator ──
const genId = (prefix = "id") => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ── User Engine ──
const UserEngine = {
  createUser({ name, email, password, role = USER_ROLES.BOTH }) {
    return {
      id: genId("user"),
      name,
      email,
      passwordHash: btoa(password), // в реале — bcrypt
      role,
      bio: "",
      avatar: null,
      skills: [],           // [{ name, level, verified }]
      wantToLearn: [],      // [{ name, level }]
      balance: 0,           // баланс на платформе
      isPro: false,
      proExpiresAt: null,
      rating: null,         // null пока нет отзывов
      reviewCount: 0,
      totalEarned: 0,
      totalSpent: 0,
      languages: [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      portfolio: [],        // [{ title, url, description }]
      certificates: [],     // выданные платформой сертификаты
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      isVerifiedIdentity: false,
      corporateId: null,    // если корпоративный пользователь
    };
  },

  addSkill(user, skillName, level) {
    if (user.skills.find(s => s.name === skillName)) {
      return { ...user, skills: user.skills.map(s => s.name === skillName ? { ...s, level } : s) };
    }
    return { ...user, skills: [...user.skills, { name: skillName, level, verified: VERIFICATION_STATUS.UNVERIFIED }] };
  },

  addWantToLearn(user, skillName, level) {
    if (user.wantToLearn.find(s => s.name === skillName)) return user;
    return { ...user, wantToLearn: [...user.wantToLearn, { name: skillName, level }] };
  },

  updateRating(user, newRating) {
    const totalScore = (user.rating || 0) * user.reviewCount + newRating;
    const newCount = user.reviewCount + 1;
    return { ...user, rating: totalScore / newCount, reviewCount: newCount };
  },

  activatePro(user) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    return { ...user, isPro: true, proExpiresAt: expiresAt.toISOString() };
  },

  deductBalance(user, amount) {
    if (user.balance < amount) throw new Error("Недостаточно средств");
    return { ...user, balance: user.balance - amount, totalSpent: user.totalSpent + amount };
  },

  addBalance(user, amount) {
    return { ...user, balance: user.balance + amount, totalEarned: user.totalEarned + amount };
  },
};

// ── Listing Engine ──
const ListingEngine = {
  createListing({
    expertId,
    type,
    title,
    description,
    skillName,
    skillLevel,
    price,           // цена за сессию/курс. 0 для бартера
    currency = "USD",
    durationMinutes, // длительность одной сессии
    totalSessions,   // для курсов
    maxStudents,     // для групп
    syllabus,        // [{ title, description, durationMinutes }]
    language,
    tags,
    schedule,        // [{ dayOfWeek, startTime, endTime }]
  }) {
    if (type === SESSION_TYPES.GROUP && maxStudents > MAX_GROUP_SIZE) {
      throw new Error(`Максимум ${MAX_GROUP_SIZE} учеников в группе`);
    }
    return {
      id: genId("listing"),
      expertId,
      type,
      title,
      description,
      skillName,
      skillLevel,
      price,
      currency,
      durationMinutes: durationMinutes || 60,
      totalSessions: totalSessions || 1,
      maxStudents: maxStudents || (type === SESSION_TYPES.ONE_ON_ONE ? 1 : 10),
      currentStudents: 0,
      syllabus: syllabus || [],
      language: language || "ru",
      tags: tags || [],
      schedule: schedule || [],
      rating: null,
      reviewCount: 0,
      enrolledStudents: [],
      isActive: true,
      isFeatured: false,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  enrollStudent(listing, studentId) {
    if (!listing.isActive) throw new Error("Листинг неактивен");
    if (listing.enrolledStudents.includes(studentId)) throw new Error("Уже записан");
    if (listing.currentStudents >= listing.maxStudents) throw new Error("Нет мест");
    return {
      ...listing,
      enrolledStudents: [...listing.enrolledStudents, studentId],
      currentStudents: listing.currentStudents + 1,
    };
  },

  unenrollStudent(listing, studentId) {
    return {
      ...listing,
      enrolledStudents: listing.enrolledStudents.filter(id => id !== studentId),
      currentStudents: Math.max(0, listing.currentStudents - 1),
    };
  },

  updateRating(listing, newRating) {
    const totalScore = (listing.rating || 0) * listing.reviewCount + newRating;
    const newCount = listing.reviewCount + 1;
    return { ...listing, rating: totalScore / newCount, reviewCount: newCount };
  },

  incrementViews(listing) {
    return { ...listing, views: listing.views + 1 };
  },

  calculateEarnings(listing, studentCount = 1) {
    const gross = listing.price * studentCount;
    const commission = gross * COMMISSION_RATE;
    const net = gross - commission;
    return { gross, commission, net };
  },
};

// ── Booking Engine ──
const BookingEngine = {
  createBooking({ listingId, studentId, expertId, scheduledAt, durationMinutes, price, type }) {
    return {
      id: genId("booking"),
      listingId,
      studentId,
      expertId,
      scheduledAt,
      durationMinutes,
      price,
      type,
      status: BOOKING_STATUS.PENDING,
      paymentHeld: false,     // деньги заморожены до завершения сессии
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
      disputedAt: null,
      disputeReason: null,
      meetingUrl: null,       // в реале — генерация Jitsi/Daily.co ссылки
      notes: "",
      studentReview: null,
      expertReview: null,
      createdAt: new Date().toISOString(),
    };
  },

  confirm(booking) {
    if (booking.status !== BOOKING_STATUS.PENDING) throw new Error("Бронирование не в статусе PENDING");
    return { ...booking, status: BOOKING_STATUS.CONFIRMED, meetingUrl: `https://meet.edgeflow.app/${booking.id}` };
  },

  complete(booking) {
    if (booking.status !== BOOKING_STATUS.CONFIRMED) throw new Error("Сессия не подтверждена");
    return { ...booking, status: BOOKING_STATUS.COMPLETED, completedAt: new Date().toISOString() };
  },

  cancel(booking, reason, cancelledBy) {
    return {
      ...booking,
      status: BOOKING_STATUS.CANCELLED,
      cancelledAt: new Date().toISOString(),
      cancelReason: reason,
      cancelledBy,
    };
  },

  dispute(booking, reason) {
    return {
      ...booking,
      status: BOOKING_STATUS.DISPUTED,
      disputedAt: new Date().toISOString(),
      disputeReason: reason,
    };
  },

  addReview(booking, role, review) {
    // role: "student" | "expert"
    const key = role === "student" ? "studentReview" : "expertReview";
    return { ...booking, [key]: { ...review, createdAt: new Date().toISOString() } };
  },

  // Проверяет конфликт в расписании эксперта
  checkConflict(existingBookings, newScheduledAt, durationMinutes) {
    const newStart = new Date(newScheduledAt).getTime();
    const newEnd = newStart + (durationMinutes + SESSION_BUFFER_MINUTES) * 60000;

    return existingBookings.some(b => {
      if ([BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(b.status)) return false;
      const bStart = new Date(b.scheduledAt).getTime();
      const bEnd = bStart + (b.durationMinutes + SESSION_BUFFER_MINUTES) * 60000;
      return newStart < bEnd && newEnd > bStart;
    });
  },
};

// ── Barter Engine ──
const BarterEngine = {
  createOffer({ fromUserId, offeredSkill, offeredLevel, wantedSkill, wantedLevel, hoursOffered, description }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + BARTER_EXPIRY_DAYS);
    return {
      id: genId("barter"),
      fromUserId,
      offeredSkill,
      offeredLevel,
      wantedSkill,
      wantedLevel,
      hoursOffered,      // сколько часов предлагаешь
      description,
      status: "open",    // open | matched | completed | expired
      matchedUserId: null,
      matchedAt: null,
      completedAt: null,
      sessions: [],      // проведённые сессии по бартеру
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };
  },

  // Находит подходящие бартерные офферы для пользователя
  findMatches(offer, allOffers, currentUserId) {
    return Object.values(allOffers).filter(o =>
      o.id !== offer.id &&
      o.fromUserId !== currentUserId &&
      o.status === "open" &&
      new Date(o.expiresAt) > new Date() &&
      o.offeredSkill.toLowerCase() === offer.wantedSkill.toLowerCase() &&
      o.wantedSkill.toLowerCase() === offer.offeredSkill.toLowerCase()
    );
  },

  acceptMatch(offer, matchedUserId) {
    return {
      ...offer,
      status: "matched",
      matchedUserId,
      matchedAt: new Date().toISOString(),
    };
  },

  completeSession(offer, sessionData) {
    return {
      ...offer,
      sessions: [...offer.sessions, { ...sessionData, completedAt: new Date().toISOString() }],
    };
  },
};

// ── Transaction Engine ──
const TransactionEngine = {
  createTransaction({ fromUserId, toUserId, amount, type, referenceId, description }) {
    // type: "booking_payment" | "booking_payout" | "commission" | "pro_subscription" |
    //       "verification" | "refund" | "corporate_package" | "deposit" | "withdrawal"
    return {
      id: genId("tx"),
      fromUserId,
      toUserId,
      amount,
      type,
      referenceId,
      description,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
  },

  // Полный цикл оплаты бронирования
  processBookingPayment(student, expert, booking, listing) {
    const { gross, commission, net } = ListingEngine.calculateEarnings(listing);

    if (student.balance < gross) throw new Error("Недостаточно средств на балансе");

    const updatedStudent = UserEngine.deductBalance(student, gross);
    const updatedExpert = UserEngine.addBalance(expert, net);

    const transactions = [
      TransactionEngine.createTransaction({
        fromUserId: student.id,
        toUserId: "platform",
        amount: commission,
        type: "commission",
        referenceId: booking.id,
        description: `Комиссия платформы за бронирование ${booking.id}`,
      }),
      TransactionEngine.createTransaction({
        fromUserId: student.id,
        toUserId: expert.id,
        amount: net,
        type: "booking_payment",
        referenceId: booking.id,
        description: `Оплата сессии: ${listing.title}`,
      }),
    ];

    return { updatedStudent, updatedExpert, transactions };
  },

  processRefund(student, expert, booking, listing, fullRefund = true) {
    const refundAmount = fullRefund ? listing.price : listing.price * 0.5;
    const updatedStudent = UserEngine.addBalance(student, refundAmount);
    const updatedExpert = UserEngine.deductBalance(expert, fullRefund ? listing.price * (1 - COMMISSION_RATE) : listing.price * 0.5 * (1 - COMMISSION_RATE));

    const tx = TransactionEngine.createTransaction({
      fromUserId: expert.id,
      toUserId: student.id,
      amount: refundAmount,
      type: "refund",
      referenceId: booking.id,
      description: `Возврат за отменённую сессию ${booking.id}`,
    });

    return { updatedStudent, updatedExpert, transaction: tx };
  },
};

// ── Search Engine ──
const SearchEngine = {
  filterListings(listings, filters, users) {
    return Object.values(listings).filter(listing => {
      if (!listing.isActive) return false;

      if (filters.query) {
        const q = filters.query.toLowerCase();
        const match =
          listing.title.toLowerCase().includes(q) ||
          listing.description.toLowerCase().includes(q) ||
          listing.skillName.toLowerCase().includes(q) ||
          listing.tags.some(t => t.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (filters.sessionType && listing.type !== filters.sessionType) return false;
      if (filters.priceMin && listing.price < filters.priceMin) return false;
      if (filters.priceMax && listing.price > filters.priceMax) return false;
      if (filters.rating && (listing.rating || 0) < filters.rating) return false;
      if (filters.language && listing.language !== filters.language) return false;

      if (filters.verifiedOnly) {
        const expert = users[listing.expertId];
        if (!expert?.skills.find(s => s.name === listing.skillName && s.verified === VERIFICATION_STATUS.VERIFIED)) return false;
      }

      return true;
    });
  },

  sortListings(listings, sortBy = "relevance") {
    const arr = [...listings];
    switch (sortBy) {
      case "rating":    return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "price_asc": return arr.sort((a, b) => a.price - b.price);
      case "price_desc":return arr.sort((a, b) => b.price - a.price);
      case "newest":    return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case "popular":   return arr.sort((a, b) => b.currentStudents - a.currentStudents);
      default:          return arr.sort((a, b) => ((b.rating || 0) * b.reviewCount) - ((a.rating || 0) * a.reviewCount));
    }
  },

  // Умный матчинг: находит экспертов под навыки которые хочет изучить пользователь
  findRecommendations(currentUser, listings, users) {
    if (!currentUser?.wantToLearn?.length) return [];

    return currentUser.wantToLearn.flatMap(({ name, level }) =>
      Object.values(listings).filter(l =>
        l.isActive &&
        l.skillName.toLowerCase() === name.toLowerCase() &&
        l.expertId !== currentUser.id
      )
    ).slice(0, 20);
  },

  // Находит людей для бартера
  findBarterMatches(currentUser, barterOffers) {
    if (!currentUser?.skills?.length || !currentUser?.wantToLearn?.length) return [];

    return Object.values(barterOffers).filter(offer => {
      if (offer.fromUserId === currentUser.id) return false;
      if (offer.status !== "open") return false;
      if (new Date(offer.expiresAt) < new Date()) return false;

      const canTeach = currentUser.skills.some(s =>
        s.name.toLowerCase() === offer.wantedSkill.toLowerCase()
      );
      const wantsToLearn = currentUser.wantToLearn.some(s =>
        s.name.toLowerCase() === offer.offeredSkill.toLowerCase()
      );

      return canTeach && wantsToLearn;
    });
  },
};

// ── Verification Engine ──
const VerificationEngine = {
  requestVerification({ userId, skillName, evidence }) {
    // evidence: { type: "screenshot" | "portfolio" | "certificate", url, description }
    return {
      id: genId("verif"),
      userId,
      skillName,
      evidence,
      status: VERIFICATION_STATUS.PENDING,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      certificateId: null,
      createdAt: new Date().toISOString(),
    };
  },

  approve(verification, reviewerId) {
    return {
      ...verification,
      status: VERIFICATION_STATUS.VERIFIED,
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      certificateId: genId("cert"),
    };
  },

  reject(verification, reviewerId, reason) {
    return {
      ...verification,
      status: VERIFICATION_STATUS.REJECTED,
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    };
  },

  generateCertificate(user, skillName, verificationId) {
    return {
      id: genId("cert"),
      userId: user.id,
      userName: user.name,
      skillName,
      verificationId,
      issuedAt: new Date().toISOString(),
      expiresAt: null,  // бессрочный
      // В реале — PDF с QR-кодом для проверки работодателем
      verifyUrl: `https://edgeflow.app/verify/${verificationId}`,
    };
  },
};

// ── Corporate Engine ──
const CorporateEngine = {
  createAccount({ companyName, contactEmail, plan, sessionBudget }) {
    // plan: "starter" (500/мес) | "growth" (1500/мес) | "enterprise" (custom)
    const plans = {
      starter:    { price: 500,  sessions: 20,  users: 10 },
      growth:     { price: 1500, sessions: 80,  users: 50 },
      enterprise: { price: 0,    sessions: 999, users: 999 }, // custom pricing
    };

    return {
      id: genId("corp"),
      companyName,
      contactEmail,
      plan,
      planDetails: plans[plan],
      sessionBudget: sessionBudget || plans[plan].price,
      usedSessions: 0,
      employees: [],      // userId[]
      adminUserId: null,
      activeUntil: (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d.toISOString();
      })(),
      invoices: [],
      createdAt: new Date().toISOString(),
    };
  },

  addEmployee(account, userId) {
    if (account.employees.includes(userId)) return account;
    if (account.employees.length >= account.planDetails.users) throw new Error("Лимит сотрудников превышен");
    return { ...account, employees: [...account.employees, userId] };
  },

  useSession(account) {
    if (account.usedSessions >= account.planDetails.sessions) throw new Error("Лимит сессий исчерпан");
    return { ...account, usedSessions: account.usedSessions + 1 };
  },

  getUsageStats(account, bookings) {
    const corpBookings = Object.values(bookings).filter(b =>
      account.employees.includes(b.studentId)
    );
    return {
      totalSessions: corpBookings.length,
      completedSessions: corpBookings.filter(b => b.status === BOOKING_STATUS.COMPLETED).length,
      totalSpent: corpBookings.reduce((sum, b) => sum + b.price, 0),
      topSkills: corpBookings.reduce((acc, b) => {
        // агрегация по навыкам
        return acc;
      }, {}),
    };
  },
};

// ── Notification Engine ──
const NotificationEngine = {
  create({ userId, type, title, body, data }) {
    return {
      id: genId("notif"),
      userId,
      type,  // booking_confirmed | session_reminder | review_request | barter_match | payment_received | verification_result
      title,
      body,
      data,
      read: false,
      createdAt: new Date().toISOString(),
    };
  },

  bookingConfirmed(booking, listing) {
    return NotificationEngine.create({
      userId: booking.studentId,
      type: "booking_confirmed",
      title: "Бронирование подтверждено",
      body: `Сессия "${listing.title}" подтверждена. Ссылка на встречу готова.`,
      data: { bookingId: booking.id, meetingUrl: booking.meetingUrl },
    });
  },

  sessionReminder(booking, listing, minutesBefore = 30) {
    return NotificationEngine.create({
      userId: booking.studentId,
      type: "session_reminder",
      title: `Сессия через ${minutesBefore} минут`,
      body: `"${listing.title}" начинается скоро. Приготовься.`,
      data: { bookingId: booking.id, meetingUrl: booking.meetingUrl },
    });
  },

  reviewRequest(booking, listing, targetUserId) {
    return NotificationEngine.create({
      userId: targetUserId,
      type: "review_request",
      title: "Оцени сессию",
      body: `Как прошла "${listing.title}"? Твой отзыв помогает сообществу.`,
      data: { bookingId: booking.id },
    });
  },

  barterMatch(offer, matchedOffer) {
    return NotificationEngine.create({
      userId: offer.fromUserId,
      type: "barter_match",
      title: "Найден партнёр для обмена",
      body: `Кто-то хочет обменять "${matchedOffer.offeredSkill}" на твой "${offer.offeredSkill}".`,
      data: { offerId: offer.id, matchedOfferId: matchedOffer.id },
    });
  },

  paymentReceived(expertId, amount, listing) {
    return NotificationEngine.create({
      userId: expertId,
      type: "payment_received",
      title: "Получена оплата",
      body: `$${amount.toFixed(2)} зачислено за "${listing.title}"`,
      data: { amount, listingId: listing.id },
    });
  },
};

// ── Analytics Engine ──
const AnalyticsEngine = {
  getUserStats(userId, bookings, listings, transactions) {
    const asStudent = Object.values(bookings).filter(b => b.studentId === userId);
    const asExpert  = Object.values(bookings).filter(b => b.expertId === userId);
    const myListings = Object.values(listings).filter(l => l.expertId === userId);

    return {
      asStudent: {
        total: asStudent.length,
        completed: asStudent.filter(b => b.status === BOOKING_STATUS.COMPLETED).length,
        upcoming: asStudent.filter(b =>
          b.status === BOOKING_STATUS.CONFIRMED &&
          new Date(b.scheduledAt) > new Date()
        ).length,
        totalSpent: asStudent.reduce((s, b) => s + b.price, 0),
        uniqueSkills: [...new Set(asStudent.map(b => {
          const l = listings[b.listingId];
          return l?.skillName;
        }).filter(Boolean))].length,
      },
      asExpert: {
        totalSessions: asExpert.length,
        completedSessions: asExpert.filter(b => b.status === BOOKING_STATUS.COMPLETED).length,
        totalEarned: asExpert
          .filter(b => b.status === BOOKING_STATUS.COMPLETED)
          .reduce((s, b) => s + b.price * (1 - COMMISSION_RATE), 0),
        activeListings: myListings.filter(l => l.isActive).length,
        totalStudents: myListings.reduce((s, l) => s + l.currentStudents, 0),
        avgRating: myListings.reduce((s, l) => s + (l.rating || 0), 0) / (myListings.length || 1),
      },
    };
  },

  getPlatformStats(users, listings, bookings, transactions) {
    const completedBookings = Object.values(bookings).filter(b => b.status === BOOKING_STATUS.COMPLETED);
    const totalVolume = completedBookings.reduce((s, b) => s + b.price, 0);

    return {
      totalUsers: Object.keys(users).length,
      totalListings: Object.keys(listings).length,
      totalBookings: Object.keys(bookings).length,
      completedSessions: completedBookings.length,
      totalVolume,
      platformRevenue: totalVolume * COMMISSION_RATE,
      topCategories: Object.values(listings).reduce((acc, l) => {
        acc[l.skillName] = (acc[l.skillName] || 0) + l.currentStudents;
        return acc;
      }, {}),
    };
  },
};

// ───────────────────────────────────────────
//  4. ХУКИ
// ───────────────────────────────────────────

function useAuth(dispatch) {
  const register = useCallback(async (name, email, password, role) => {
    dispatch({ type: "SET_LOADING", payload: { key: "auth", value: true } });
    try {
      const user = UserEngine.createUser({ name, email, password, role });
      dispatch({ type: "ADD_USER", payload: user });
      dispatch({ type: "SET_CURRENT_USER", payload: user });
      return user;
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: { key: "auth", value: e.message } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "auth", value: false } });
    }
  }, [dispatch]);

  const login = useCallback(async (email, password, users) => {
    dispatch({ type: "SET_LOADING", payload: { key: "auth", value: true } });
    try {
      const user = Object.values(users).find(u => u.email === email && u.passwordHash === btoa(password));
      if (!user) throw new Error("Неверный email или пароль");
      dispatch({ type: "SET_CURRENT_USER", payload: user });
      dispatch({ type: "UPDATE_USER", payload: { id: user.id, lastActiveAt: new Date().toISOString() } });
      return user;
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: { key: "auth", value: e.message } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "auth", value: false } });
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    dispatch({ type: "SET_CURRENT_USER", payload: null });
  }, [dispatch]);

  return { register, login, logout };
}

function useListings(state, dispatch) {
  const createListing = useCallback(async (data) => {
    dispatch({ type: "SET_LOADING", payload: { key: "createListing", value: true } });
    try {
      const listing = ListingEngine.createListing({ ...data, expertId: state.currentUser.id });
      dispatch({ type: "ADD_LISTING", payload: listing });
      return listing;
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: { key: "createListing", value: e.message } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "createListing", value: false } });
    }
  }, [state.currentUser, dispatch]);

  const deleteListing = useCallback((listingId) => {
    const listing = state.listings[listingId];
    if (listing?.expertId !== state.currentUser?.id) throw new Error("Нет прав");
    if (listing?.currentStudents > 0) throw new Error("Нельзя удалить листинг с активными учениками");
    dispatch({ type: "DELETE_LISTING", payload: listingId });
  }, [state, dispatch]);

  const viewListing = useCallback((listingId) => {
    const listing = state.listings[listingId];
    if (!listing) return;
    dispatch({ type: "UPDATE_LISTING", payload: ListingEngine.incrementViews(listing) });
  }, [state.listings, dispatch]);

  const getMyListings = useCallback(() => {
    if (!state.currentUser) return [];
    return Object.values(state.listings).filter(l => l.expertId === state.currentUser.id);
  }, [state.listings, state.currentUser]);

  const searchListings = useCallback((sortBy = "relevance") => {
    const filtered = SearchEngine.filterListings(state.listings, state.searchState, state.users);
    return SearchEngine.sortListings(filtered, sortBy);
  }, [state.listings, state.searchState, state.users]);

  const getRecommendations = useCallback(() => {
    return SearchEngine.findRecommendations(state.currentUser, state.listings, state.users);
  }, [state.currentUser, state.listings, state.users]);

  return { createListing, deleteListing, viewListing, getMyListings, searchListings, getRecommendations };
}

function useBookings(state, dispatch) {
  const bookSession = useCallback(async (listingId, scheduledAt) => {
    dispatch({ type: "SET_LOADING", payload: { key: "booking", value: true } });
    try {
      const listing = state.listings[listingId];
      if (!listing) throw new Error("Листинг не найден");
      if (!state.currentUser) throw new Error("Нужно войти в аккаунт");
      if (listing.expertId === state.currentUser.id) throw new Error("Нельзя забронировать свой листинг");

      const expert = state.users[listing.expertId];
      const student = state.currentUser;

      // Проверка конфликта расписания у эксперта
      const expertBookings = Object.values(state.bookings).filter(b => b.expertId === expert.id);
      if (BookingEngine.checkConflict(expertBookings, scheduledAt, listing.durationMinutes)) {
        throw new Error("Это время уже занято у эксперта");
      }

      // Оплата
      const { updatedStudent, updatedExpert, transactions } = TransactionEngine.processBookingPayment(
        student, expert, { id: "temp" }, listing
      );

      // Создаём бронирование
      const booking = BookingEngine.createBooking({
        listingId,
        studentId: student.id,
        expertId: expert.id,
        scheduledAt,
        durationMinutes: listing.durationMinutes,
        price: listing.price,
        type: listing.type,
      });

      const confirmedBooking = BookingEngine.confirm(booking);
      const updatedListing = ListingEngine.enrollStudent(listing, student.id);

      // Диспатчим всё
      dispatch({ type: "UPDATE_USER", payload: updatedStudent });
      dispatch({ type: "UPDATE_USER", payload: updatedExpert });
      dispatch({ type: "ADD_BOOKING", payload: confirmedBooking });
      dispatch({ type: "UPDATE_LISTING", payload: updatedListing });
      transactions.forEach(tx => dispatch({ type: "ADD_TRANSACTION", payload: tx }));

      // Уведомления
      dispatch({ type: "ADD_NOTIFICATION", payload: NotificationEngine.bookingConfirmed(confirmedBooking, listing) });
      dispatch({ type: "ADD_NOTIFICATION", payload: NotificationEngine.paymentReceived(expert.id, listing.price * (1 - COMMISSION_RATE), listing) });

      return confirmedBooking;
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: { key: "booking", value: e.message } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { key: "booking", value: false } });
    }
  }, [state, dispatch]);

  const completeSession = useCallback(async (bookingId) => {
    const booking = state.bookings[bookingId];
    if (!booking) throw new Error("Бронирование не найдено");
    const completed = BookingEngine.complete(booking);
    dispatch({ type: "UPDATE_BOOKING", payload: completed });

    // Запрос отзыва
    const listing = state.listings[booking.listingId];
    dispatch({ type: "ADD_NOTIFICATION", payload: NotificationEngine.reviewRequest(booking, listing, booking.studentId) });
    dispatch({ type: "ADD_NOTIFICATION", payload: NotificationEngine.reviewRequest(booking, listing, booking.expertId) });

    return completed;
  }, [state, dispatch]);

  const cancelBooking = useCallback(async (bookingId, reason) => {
    const booking = state.bookings[bookingId];
    if (!booking) throw new Error("Бронирование не найдено");

    const cancelled = BookingEngine.cancel(booking, reason, state.currentUser.id);
    dispatch({ type: "UPDATE_BOOKING", payload: cancelled });

    // Возврат денег
    const listing = state.listings[booking.listingId];
    const student = state.users[booking.studentId];
    const expert = state.users[booking.expertId];
    const hoursUntilSession = (new Date(booking.scheduledAt) - new Date()) / 3600000;
    const fullRefund = hoursUntilSession >= 24;

    const { updatedStudent, updatedExpert, transaction } = TransactionEngine.processRefund(
      student, expert, booking, listing, fullRefund
    );
    dispatch({ type: "UPDATE_USER", payload: updatedStudent });
    dispatch({ type: "UPDATE_USER", payload: updatedExpert });
    dispatch({ type: "ADD_TRANSACTION", payload: transaction });

    return cancelled;
  }, [state, dispatch]);

  const leaveReview = useCallback(async (bookingId, rating, comment) => {
    const booking = state.bookings[bookingId];
    if (!booking) throw new Error("Бронирование не найдено");
    if (booking.status !== BOOKING_STATUS.COMPLETED) throw new Error("Сессия ещё не завершена");

    const role = booking.studentId === state.currentUser.id ? "student" : "expert";
    const review = { rating, comment, authorId: state.currentUser.id };
    const updatedBooking = BookingEngine.addReview(booking, role, review);
    dispatch({ type: "UPDATE_BOOKING", payload: updatedBooking });

    // Обновляем рейтинг эксперта если отзыв от студента
    if (role === "student") {
      const expert = state.users[booking.expertId];
      const listing = state.listings[booking.listingId];
      dispatch({ type: "UPDATE_USER", payload: UserEngine.updateRating(expert, rating) });
      dispatch({ type: "UPDATE_LISTING", payload: ListingEngine.updateRating(listing, rating) });
    }
  }, [state, dispatch]);

  const getMyBookingsAsStudent = useCallback(() => {
    if (!state.currentUser) return [];
    return Object.values(state.bookings).filter(b => b.studentId === state.currentUser.id);
  }, [state.bookings, state.currentUser]);

  const getMyBookingsAsExpert = useCallback(() => {
    if (!state.currentUser) return [];
    return Object.values(state.bookings).filter(b => b.expertId === state.currentUser.id);
  }, [state.bookings, state.currentUser]);

  return { bookSession, completeSession, cancelBooking, leaveReview, getMyBookingsAsStudent, getMyBookingsAsExpert };
}

function useBarter(state, dispatch) {
  const createOffer = useCallback((data) => {
    const offer = BarterEngine.createOffer({ ...data, fromUserId: state.currentUser.id });
    dispatch({ type: "ADD_BARTER_OFFER", payload: offer });
    return offer;
  }, [state.currentUser, dispatch]);

  const acceptMatch = useCallback((offerId, myOfferId) => {
    const offer = state.barterOffers[offerId];
    if (!offer) throw new Error("Оффер не найден");
    const matched = BarterEngine.acceptMatch(offer, state.currentUser.id);
    dispatch({ type: "UPDATE_BARTER_OFFER", payload: matched });

    dispatch({ type: "ADD_NOTIFICATION", payload: NotificationEngine.barterMatch(offer, state.barterOffers[myOfferId]) });
  }, [state, dispatch]);

  const getMyOffers = useCallback(() => {
    if (!state.currentUser) return [];
    return Object.values(state.barterOffers).filter(o => o.fromUserId === state.currentUser.id);
  }, [state.barterOffers, state.currentUser]);

  const getBarterMatches = useCallback(() => {
    if (!state.currentUser) return [];
    return SearchEngine.findBarterMatches(state.currentUser, state.barterOffers);
  }, [state.currentUser, state.barterOffers]);

  return { createOffer, acceptMatch, getMyOffers, getBarterMatches };
}

function useProfile(state, dispatch) {
  const updateProfile = useCallback((data) => {
    if (!state.currentUser) return;
    dispatch({ type: "UPDATE_USER", payload: { id: state.currentUser.id, ...data } });
  }, [state.currentUser, dispatch]);

  const addSkill = useCallback((skillName, level) => {
    if (!state.currentUser) return;
    const updated = UserEngine.addSkill(state.currentUser, skillName, level);
    dispatch({ type: "UPDATE_USER", payload: updated });
  }, [state.currentUser, dispatch]);

  const addWantToLearn = useCallback((skillName, level) => {
    if (!state.currentUser) return;
    const updated = UserEngine.addWantToLearn(state.currentUser, skillName, level);
    dispatch({ type: "UPDATE_USER", payload: updated });
  }, [state.currentUser, dispatch]);

  const requestVerification = useCallback((skillName, evidence) => {
    if (!state.currentUser) return;
    if (state.currentUser.balance < VERIFICATION_PRICE) throw new Error("Недостаточно средств для верификации");

    const verification = VerificationEngine.requestVerification({
      userId: state.currentUser.id,
      skillName,
      evidence,
    });

    const updatedUser = UserEngine.deductBalance(state.currentUser, VERIFICATION_PRICE);
    dispatch({ type: "UPDATE_USER", payload: updatedUser });
    dispatch({ type: "ADD_VERIFICATION", payload: verification });

    const tx = TransactionEngine.createTransaction({
      fromUserId: state.currentUser.id,
      toUserId: "platform",
      amount: VERIFICATION_PRICE,
      type: "verification",
      referenceId: verification.id,
      description: `Верификация навыка: ${skillName}`,
    });
    dispatch({ type: "ADD_TRANSACTION", payload: tx });

    return verification;
  }, [state.currentUser, dispatch]);

  const subscribePro = useCallback(() => {
    if (!state.currentUser) return;
    if (state.currentUser.balance < PRO_MONTHLY_PRICE) throw new Error("Недостаточно средств");

    const updatedUser = UserEngine.activatePro(UserEngine.deductBalance(state.currentUser, PRO_MONTHLY_PRICE));
    dispatch({ type: "UPDATE_USER", payload: updatedUser });

    const tx = TransactionEngine.createTransaction({
      fromUserId: state.currentUser.id,
      toUserId: "platform",
      amount: PRO_MONTHLY_PRICE,
      type: "pro_subscription",
      referenceId: state.currentUser.id,
      description: "Pro подписка на 1 месяц",
    });
    dispatch({ type: "ADD_TRANSACTION", payload: tx });
  }, [state.currentUser, dispatch]);

  const depositBalance = useCallback((amount) => {
    if (!state.currentUser) return;
    const updatedUser = UserEngine.addBalance(state.currentUser, amount);
    dispatch({ type: "UPDATE_USER", payload: updatedUser });

    const tx = TransactionEngine.createTransaction({
      fromUserId: "external",
      toUserId: state.currentUser.id,
      amount,
      type: "deposit",
      referenceId: state.currentUser.id,
      description: `Пополнение баланса на $${amount}`,
    });
    dispatch({ type: "ADD_TRANSACTION", payload: tx });
  }, [state.currentUser, dispatch]);

  const getStats = useCallback(() => {
    if (!state.currentUser) return null;
    return AnalyticsEngine.getUserStats(
      state.currentUser.id,
      state.bookings,
      state.listings,
      state.transactions
    );
  }, [state]);

  const getMyTransactions = useCallback(() => {
    if (!state.currentUser) return [];
    return Object.values(state.transactions).filter(t =>
      t.fromUserId === state.currentUser.id || t.toUserId === state.currentUser.id
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [state.transactions, state.currentUser]);

  return { updateProfile, addSkill, addWantToLearn, requestVerification, subscribePro, depositBalance, getStats, getMyTransactions };
}

function useChats(state, dispatch) {
  const getOrCreateChat = useCallback((otherUserId) => {
    if (!state.currentUser) return null;
    const existing = Object.values(state.chats).find(c =>
      c.participants.includes(state.currentUser.id) && c.participants.includes(otherUserId)
    );
    if (existing) return existing;

    const chat = {
      id: genId("chat"),
      participants: [state.currentUser.id, otherUserId],
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_CHAT", payload: chat });
    return chat;
  }, [state.currentUser, state.chats, dispatch]);

  const sendMessage = useCallback((chatId, text, type = "text") => {
    if (!state.currentUser) return;
    const message = {
      id: genId("msg"),
      senderId: state.currentUser.id,
      text,
      type,  // text | file | system
      readBy: [state.currentUser.id],
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: { chatId, message } });
    return message;
  }, [state.currentUser, dispatch]);

  const getMyChats = useCallback(() => {
    if (!state.currentUser) return [];
    return Object.values(state.chats)
      .filter(c => c.participants.includes(state.currentUser.id))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [state.chats, state.currentUser]);

  const getUnreadCount = useCallback((chatId) => {
    const chat = state.chats[chatId];
    if (!chat || !state.currentUser) return 0;
    return chat.messages.filter(m =>
      m.senderId !== state.currentUser.id && !m.readBy.includes(state.currentUser.id)
    ).length;
  }, [state.chats, state.currentUser]);

  return { getOrCreateChat, sendMessage, getMyChats, getUnreadCount };
}

function useNotifications(state, dispatch) {
  const getMyNotifications = useCallback(() => {
    if (!state.currentUser) return [];
    return Object.values(state.notifications)
      .filter(n => n.userId === state.currentUser.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [state.notifications, state.currentUser]);

  const getUnreadCount = useCallback(() => {
    if (!state.currentUser) return 0;
    return Object.values(state.notifications).filter(n =>
      n.userId === state.currentUser.id && !n.read
    ).length;
  }, [state.notifications, state.currentUser]);

  const markRead = useCallback((notificationId) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId });
  }, [dispatch]);

  const markAllRead = useCallback(() => {
    if (!state.currentUser) return;
    Object.values(state.notifications)
      .filter(n => n.userId === state.currentUser.id && !n.read)
      .forEach(n => dispatch({ type: "MARK_NOTIFICATION_READ", payload: n.id }));
  }, [state.notifications, state.currentUser, dispatch]);

  return { getMyNotifications, getUnreadCount, markRead, markAllRead };
}

// ───────────────────────────────────────────
//  SEED — демо-данные для тестирования
// ───────────────────────────────────────────

function seedDemoData(dispatch) {
  // Пользователи
  const alice = UserEngine.createUser({ name: "Alice Chen", email: "alice@demo.com", password: "pass123", role: USER_ROLES.BOTH });
  const bob   = UserEngine.createUser({ name: "Bob Ivanov",  email: "bob@demo.com",   password: "pass123", role: USER_ROLES.EXPERT });
  const carol = UserEngine.createUser({ name: "Carol Kim",   email: "carol@demo.com", password: "pass123", role: USER_ROLES.STUDENT });

  const aliceWithSkills = UserEngine.addSkill(
    UserEngine.addSkill(UserEngine.addWantToLearn(alice, "Python", "beginner"), "React", "expert"),
    "UI/UX Design", "intermediate"
  );
  const aliceWithBalance = UserEngine.addBalance(aliceWithSkills, 500);

  const bobWithSkills = UserEngine.addSkill(
    UserEngine.addSkill(
      UserEngine.addBalance(UserEngine.addWantToLearn(bob, "React", "beginner"), 200),
      "Python", "expert"
    ),
    "Machine Learning", "advanced"
  );

  const carolWithBalance = UserEngine.addBalance(carol, 300);

  [aliceWithBalance, bobWithSkills, carolWithBalance].forEach(u => dispatch({ type: "ADD_USER", payload: u }));
  dispatch({ type: "SET_CURRENT_USER", payload: aliceWithBalance });

  // Листинги
  const listing1 = ListingEngine.createListing({
    expertId: bob.id,
    type: SESSION_TYPES.ONE_ON_ONE,
    title: "Python для начинающих: с нуля до первого проекта",
    description: "За 5 сессий научу писать реальный код на Python. Практика с первого занятия.",
    skillName: "Python",
    skillLevel: "beginner",
    price: 45,
    durationMinutes: 60,
    totalSessions: 5,
    maxStudents: 1,
    language: "ru",
    tags: ["python", "programming", "beginners"],
    syllabus: [
      { title: "Основы синтаксиса", description: "Переменные, типы, условия", durationMinutes: 60 },
      { title: "Функции и модули",  description: "Как структурировать код",   durationMinutes: 60 },
    ],
  });

  const listing2 = ListingEngine.createListing({
    expertId: bob.id,
    type: SESSION_TYPES.GROUP,
    title: "Machine Learning: практический курс",
    description: "Групповой курс по ML. Sklearn, pandas, реальные датасеты. 8 недель.",
    skillName: "Machine Learning",
    skillLevel: "intermediate",
    price: 120,
    durationMinutes: 90,
    totalSessions: 8,
    maxStudents: 12,
    language: "ru",
    tags: ["ml", "python", "data science"],
  });

  const listing3 = ListingEngine.createListing({
    expertId: aliceWithBalance.id,
    type: SESSION_TYPES.ASYNC,
    title: "UI/UX Design: Figma от А до Я",
    description: "Асинхронный курс с проверкой домашних заданий. 6 модулей.",
    skillName: "UI/UX Design",
    skillLevel: "beginner",
    price: 80,
    durationMinutes: 0,
    totalSessions: 6,
    maxStudents: 50,
    language: "ru",
    tags: ["figma", "design", "ux"],
  });

  [listing1, listing2, listing3].forEach(l => dispatch({ type: "ADD_LISTING", payload: l }));

  // Бартер оффер
  const barterOffer = BarterEngine.createOffer({
    fromUserId: bob.id,
    offeredSkill: "Python",
    offeredLevel: "expert",
    wantedSkill: "React",
    wantedLevel: "intermediate",
    hoursOffered: 5,
    description: "Научу Python, хочу выучить React. 5 часов на 5 часов.",
  });
  dispatch({ type: "ADD_BARTER_OFFER", payload: barterOffer });
}

// ───────────────────────────────────────────
//  5. UI КОМПОНЕНТЫ (голые — только логика и структура)
// ───────────────────────────────────────────

// ── Auth Screen ──
function AuthScreen({ onLogin, onRegister, loading, error }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: USER_ROLES.BOTH });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <h2>{mode === "login" ? "Войти" : "Создать аккаунт"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {mode === "register" && (
        <div>
          <label>Имя</label>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Твоё имя" />
          <label>Кто ты?</label>
          <select value={form.role} onChange={e => set("role", e.target.value)}>
            <option value={USER_ROLES.BOTH}>Учусь и обучаю</option>
            <option value={USER_ROLES.STUDENT}>Только учусь</option>
            <option value={USER_ROLES.EXPERT}>Только обучаю</option>
          </select>
        </div>
      )}

      <label>Email</label>
      <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />

      <label>Пароль</label>
      <input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" />

      <button
        onClick={() => mode === "login"
          ? onLogin(form.email, form.password)
          : onRegister(form.name, form.email, form.password, form.role)
        }
        disabled={loading}
      >
        {loading ? "..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
      </button>

      <button onClick={() => setMode(m => m === "login" ? "register" : "login")}>
        {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
      </button>

      <button onClick={() => onLogin("alice@demo.com", "pass123")}>
        Демо-вход (Alice)
      </button>
    </div>
  );
}

// ── Discover Tab ──
function DiscoverTab({ listings, users, searchState, onSearch, onViewListing, onBook, currentUser }) {
  const [sortBy, setSortBy] = useState("relevance");
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div>
      <h2>Найти курс или репетитора</h2>

      {/* Поиск */}
      <input
        value={searchState.query}
        onChange={e => onSearch({ query: e.target.value })}
        placeholder="Поиск по навыкам, темам..."
      />

      {/* Фильтры */}
      <div>
        <select onChange={e => onSearch({ sessionType: e.target.value || null })}>
          <option value="">Все форматы</option>
          <option value={SESSION_TYPES.ONE_ON_ONE}>1 на 1</option>
          <option value={SESSION_TYPES.GROUP}>Групповой</option>
          <option value={SESSION_TYPES.ASYNC}>Асинхронный</option>
          <option value={SESSION_TYPES.MASTERMIND}>Мастермайнд</option>
        </select>

        <input
          type="number"
          placeholder="Цена от"
          onChange={e => onSearch({ priceMin: Number(e.target.value) })}
        />
        <input
          type="number"
          placeholder="Цена до"
          onChange={e => onSearch({ priceMax: Number(e.target.value) || 999 })}
        />

        <label>
          <input
            type="checkbox"
            checked={searchState.verifiedOnly}
            onChange={e => onSearch({ verifiedOnly: e.target.checked })}
          />
          Только верифицированные
        </label>

        <select onChange={e => setSortBy(e.target.value)}>
          <option value="relevance">По релевантности</option>
          <option value="rating">По рейтингу</option>
          <option value="price_asc">Дешевле</option>
          <option value="price_desc">Дороже</option>
          <option value="newest">Новые</option>
          <option value="popular">Популярные</option>
        </select>
      </div>

      {/* Список листингов */}
      {listings.length === 0 && <p>Ничего не найдено</p>}

      {listings.map(listing => {
        const expert = users[listing.expertId];
        const isExpanded = expandedId === listing.id;

        return (
          <div key={listing.id} style={{ border: "1px solid #ccc", margin: "8px 0", padding: 12 }}>
            <div onClick={() => { setExpandedId(isExpanded ? null : listing.id); onViewListing(listing.id); }}>
              <strong>{listing.title}</strong>
              <span> · {listing.type} · ${listing.price}</span>
              {listing.rating && <span> · ⭐ {listing.rating.toFixed(1)} ({listing.reviewCount})</span>}
              <div>{expert?.name} {expert?.skills.find(s => s.name === listing.skillName && s.verified === VERIFICATION_STATUS.VERIFIED) ? "✓" : ""}</div>
              <div>{listing.currentStudents}/{listing.maxStudents} учеников · {listing.skillName} · {listing.skillLevel}</div>
            </div>

            {isExpanded && (
              <div>
                <p>{listing.description}</p>
                <div>Теги: {listing.tags.join(", ")}</div>
                <div>Язык: {listing.language}</div>
                <div>Длительность сессии: {listing.durationMinutes} мин</div>

                {listing.syllabus.length > 0 && (
                  <div>
                    <strong>Программа:</strong>
                    {listing.syllabus.map((s, i) => (
                      <div key={i}>• {s.title}: {s.description}</div>
                    ))}
                  </div>
                )}

                {currentUser && listing.expertId !== currentUser.id && (
                  <div>
                    <strong>Выбери время:</strong>
                    {/* В реале — календарь с доступными слотами эксперта */}
                    <button onClick={() => onBook(listing.id, new Date(Date.now() + 86400000).toISOString())}>
                      Записаться (завтра в это же время)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── My Learning Tab ──
function MyLearningTab({ bookings, listings, users, onComplete, onCancel, onReview }) {
  const upcoming = bookings.filter(b => b.status === BOOKING_STATUS.CONFIRMED && new Date(b.scheduledAt) > new Date());
  const past = bookings.filter(b => b.status === BOOKING_STATUS.COMPLETED);
  const pending = bookings.filter(b => b.status === BOOKING_STATUS.PENDING);

  return (
    <div>
      <h2>Моё обучение</h2>

      {pending.length > 0 && (
        <div>
          <h3>Ожидают подтверждения ({pending.length})</h3>
          {pending.map(b => {
            const listing = listings[b.listingId];
            return (
              <div key={b.id} style={{ border: "1px solid orange", padding: 8, margin: "4px 0" }}>
                <strong>{listing?.title}</strong>
                <div>Статус: {b.status}</div>
              </div>
            );
          })}
        </div>
      )}

      <h3>Предстоящие ({upcoming.length})</h3>
      {upcoming.length === 0 && <p>Нет предстоящих сессий</p>}
      {upcoming.map(b => {
        const listing = listings[b.listingId];
        const expert = users[b.expertId];
        return (
          <div key={b.id} style={{ border: "1px solid #4CAF50", padding: 8, margin: "4px 0" }}>
            <strong>{listing?.title}</strong>
            <div>Эксперт: {expert?.name}</div>
            <div>Когда: {new Date(b.scheduledAt).toLocaleString()}</div>
            <div>Ссылка: <a href={b.meetingUrl} target="_blank" rel="noopener noreferrer">{b.meetingUrl}</a></div>
            <button onClick={() => onCancel(b.id, "Не могу в это время")}>Отменить</button>
          </div>
        );
      })}

      <h3>Завершённые ({past.length})</h3>
      {past.map(b => {
        const listing = listings[b.listingId];
        const hasReview = !!b.studentReview;
        return (
          <div key={b.id} style={{ border: "1px solid #ccc", padding: 8, margin: "4px 0" }}>
            <strong>{listing?.title}</strong>
            <div>Завершена: {new Date(b.completedAt).toLocaleString()}</div>
            {!hasReview && (
              <button onClick={() => onReview(b.id, 5, "Отличная сессия!")}>
                Оставить отзыв
              </button>
            )}
            {hasReview && <div>⭐ {b.studentReview.rating} — {b.studentReview.comment}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── My Teaching Tab ──
function MyTeachingTab({ listings, bookings, onCreateListing, onDeleteListing, onCompleteSession }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: SESSION_TYPES.ONE_ON_ONE,
    title: "",
    description: "",
    skillName: "",
    skillLevel: "beginner",
    price: 30,
    durationMinutes: 60,
    totalSessions: 1,
    maxStudents: 1,
    language: "ru",
    tags: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = () => {
    onCreateListing({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) });
    setShowForm(false);
    setForm({ ...form, title: "", description: "" });
  };

  const incomingSessions = bookings.filter(b =>
    b.status === BOOKING_STATUS.CONFIRMED && new Date(b.scheduledAt) < new Date()
  );

  return (
    <div>
      <h2>Мои курсы и сессии</h2>

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Отмена" : "+ Создать листинг"}
      </button>

      {showForm && (
        <div style={{ border: "1px solid #ddd", padding: 12, margin: "8px 0" }}>
          <h3>Новый листинг</h3>
          <select value={form.type} onChange={e => set("type", e.target.value)}>
            <option value={SESSION_TYPES.ONE_ON_ONE}>1 на 1</option>
            <option value={SESSION_TYPES.GROUP}>Групповой</option>
            <option value={SESSION_TYPES.ASYNC}>Асинхронный</option>
            <option value={SESSION_TYPES.MASTERMIND}>Мастермайнд</option>
          </select>
          <input placeholder="Название" value={form.title} onChange={e => set("title", e.target.value)} />
          <textarea placeholder="Описание" value={form.description} onChange={e => set("description", e.target.value)} />
          <input placeholder="Навык (напр. Python)" value={form.skillName} onChange={e => set("skillName", e.target.value)} />
          <select value={form.skillLevel} onChange={e => set("skillLevel", e.target.value)}>
            {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input type="number" placeholder="Цена $" value={form.price} onChange={e => set("price", Number(e.target.value))} />
          <input type="number" placeholder="Длительность сессии (мин)" value={form.durationMinutes} onChange={e => set("durationMinutes", Number(e.target.value))} />
          {form.type !== SESSION_TYPES.ONE_ON_ONE && (
            <input type="number" placeholder="Макс. учеников" value={form.maxStudents} onChange={e => set("maxStudents", Number(e.target.value))} />
          )}
          <input placeholder="Теги (через запятую)" value={form.tags} onChange={e => set("tags", e.target.value)} />
          <button onClick={handleCreate}>Создать</button>
        </div>
      )}

      {/* Мои листинги */}
      <h3>Мои листинги ({listings.length})</h3>
      {listings.length === 0 && <p>Создай первый листинг чтобы начать зарабатывать</p>}
      {listings.map(l => (
        <div key={l.id} style={{ border: "1px solid #ccc", padding: 8, margin: "4px 0" }}>
          <strong>{l.title}</strong>
          <div>{l.type} · ${l.price} · {l.currentStudents}/{l.maxStudents} учеников</div>
          {l.rating && <div>⭐ {l.rating.toFixed(1)} ({l.reviewCount} отзывов)</div>}
          <div>Просмотров: {l.views}</div>
          <button onClick={() => onDeleteListing(l.id)}>Удалить</button>
        </div>
      ))}

      {/* Сессии которые нужно завершить */}
      {incomingSessions.length > 0 && (
        <div>
          <h3>Требуют завершения ({incomingSessions.length})</h3>
          {incomingSessions.map(b => (
            <div key={b.id} style={{ border: "1px solid orange", padding: 8, margin: "4px 0" }}>
              Сессия {b.id.slice(-6)} · {new Date(b.scheduledAt).toLocaleString()}
              <button onClick={() => onCompleteSession(b.id)}>Отметить как завершённую</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Barter Tab ──
function BarterTab({ myOffers, matches, users, onCreateOffer, onAcceptMatch, currentUser }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    offeredSkill: "",
    offeredLevel: "intermediate",
    wantedSkill: "",
    wantedLevel: "beginner",
    hoursOffered: 5,
    description: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <h2>Обмен навыками (бартер)</h2>
      <p>Учи других тому что знаешь — получай то что хочешь изучить. Без денег.</p>

      <button onClick={() => setShowForm(!showForm)}>
        {showForm ? "Отмена" : "+ Предложить обмен"}
      </button>

      {showForm && (
        <div style={{ border: "1px solid #ddd", padding: 12, margin: "8px 0" }}>
          <h3>Новый оффер</h3>
          <input placeholder="Что предлагаешь (напр. Python)" value={form.offeredSkill} onChange={e => set("offeredSkill", e.target.value)} />
          <select value={form.offeredLevel} onChange={e => set("offeredLevel", e.target.value)}>
            {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input placeholder="Что хочешь изучить" value={form.wantedSkill} onChange={e => set("wantedSkill", e.target.value)} />
          <select value={form.wantedLevel} onChange={e => set("wantedLevel", e.target.value)}>
            {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input type="number" placeholder="Часов предлагаешь" value={form.hoursOffered} onChange={e => set("hoursOffered", Number(e.target.value))} />
          <textarea placeholder="Описание" value={form.description} onChange={e => set("description", e.target.value)} />
          <button onClick={() => { onCreateOffer(form); setShowForm(false); }}>Опубликовать</button>
        </div>
      )}

      {/* Мои офферы */}
      {myOffers.length > 0 && (
        <div>
          <h3>Мои офферы</h3>
          {myOffers.map(o => (
            <div key={o.id} style={{ border: "1px solid #ccc", padding: 8, margin: "4px 0" }}>
              <strong>{o.offeredSkill}</strong> → <strong>{o.wantedSkill}</strong>
              <div>{o.hoursOffered} часов · Статус: {o.status}</div>
              <div>Истекает: {new Date(o.expiresAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Найденные матчи */}
      <h3>Подходящие партнёры ({matches.length})</h3>
      {matches.length === 0 && <p>Пока нет подходящих офферов. Создай свой — система найдёт партнёра.</p>}
      {matches.map(o => {
        const fromUser = users[o.fromUserId];
        return (
          <div key={o.id} style={{ border: "1px solid #4CAF50", padding: 8, margin: "4px 0" }}>
            <strong>{fromUser?.name}</strong>
            <div>Предлагает: <strong>{o.offeredSkill}</strong> ({o.offeredLevel})</div>
            <div>Хочет: <strong>{o.wantedSkill}</strong></div>
            <div>{o.hoursOffered} часов</div>
            <div>{o.description}</div>
            <button onClick={() => onAcceptMatch(o.id, myOffers[0]?.id)}>
              Принять обмен
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Profile Tab ──
function ProfileTab({ user, stats, transactions, onUpdateProfile, onAddSkill, onAddWantToLearn, onVerify, onSubscribePro, onDeposit }) {
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [newSkill, setNewSkill] = useState({ name: "", level: "beginner" });
  const [newLearn, setNewLearn] = useState({ name: "", level: "beginner" });
  const [depositAmount, setDepositAmount] = useState(100);

  if (!user) return null;

  return (
    <div>
      <h2>Профиль</h2>

      {/* Баланс */}
      <div style={{ border: "2px solid #4CAF50", padding: 12, margin: "8px 0" }}>
        <strong>Баланс: ${user.balance.toFixed(2)}</strong>
        {user.isPro && <span> · PRO до {new Date(user.proExpiresAt).toLocaleDateString()}</span>}
        <div>
          <input
            type="number"
            value={depositAmount}
            onChange={e => setDepositAmount(Number(e.target.value))}
            min={10}
          />
          <button onClick={() => onDeposit(depositAmount)}>Пополнить</button>
          {!user.isPro && (
            <button onClick={onSubscribePro}>PRO за ${PRO_MONTHLY_PRICE}/мес</button>
          )}
        </div>
      </div>

      {/* Основная инфо */}
      <div>
        <h3>{user.name}</h3>
        {editMode ? (
          <div>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="О себе" />
            <button onClick={() => { onUpdateProfile({ bio }); setEditMode(false); }}>Сохранить</button>
          </div>
        ) : (
          <div>
            <p>{user.bio || "Расскажи о себе"}</p>
            <button onClick={() => setEditMode(true)}>Редактировать</button>
          </div>
        )}
      </div>

      {/* Статистика */}
      {stats && (
        <div style={{ border: "1px solid #ddd", padding: 12, margin: "8px 0" }}>
          <h3>Статистика</h3>
          <div>Как ученик: {stats.asStudent.completed} сессий завершено · Потрачено ${stats.asStudent.totalSpent}</div>
          <div>Как эксперт: {stats.asExpert.completedSessions} сессий · Заработано ${stats.asExpert.totalEarned.toFixed(2)}</div>
          <div>Активных курсов: {stats.asExpert.activeListings}</div>
        </div>
      )}

      {/* Навыки */}
      <div>
        <h3>Мои навыки</h3>
        {user.skills.map(s => (
          <div key={s.name}>
            {s.name} · {s.level} ·
            {s.verified === VERIFICATION_STATUS.VERIFIED
              ? " ✓ Верифицирован"
              : s.verified === VERIFICATION_STATUS.PENDING
              ? " ⏳ На проверке"
              : <button onClick={() => onVerify(s.name, { type: "portfolio", url: "#", description: "Портфолио" })}>
                  Верифицировать (${VERIFICATION_PRICE})
                </button>
            }
          </div>
        ))}
        <div>
          <input placeholder="Навык" value={newSkill.name} onChange={e => setNewSkill(s => ({ ...s, name: e.target.value }))} />
          <select value={newSkill.level} onChange={e => setNewSkill(s => ({ ...s, level: e.target.value }))}>
            {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={() => { onAddSkill(newSkill.name, newSkill.level); setNewSkill({ name: "", level: "beginner" }); }}>
            + Добавить навык
          </button>
        </div>
      </div>

      {/* Хочу изучить */}
      <div>
        <h3>Хочу изучить</h3>
        {user.wantToLearn.map(s => (
          <div key={s.name}>{s.name} · {s.level}</div>
        ))}
        <div>
          <input placeholder="Навык" value={newLearn.name} onChange={e => setNewLearn(s => ({ ...s, name: e.target.value }))} />
          <select value={newLearn.level} onChange={e => setNewLearn(s => ({ ...s, level: e.target.value }))}>
            {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={() => { onAddWantToLearn(newLearn.name, newLearn.level); setNewLearn({ name: "", level: "beginner" }); }}>
            + Добавить
          </button>
        </div>
      </div>

      {/* История транзакций */}
      <div>
        <h3>Транзакции</h3>
        {transactions.slice(0, 10).map(tx => (
          <div key={tx.id} style={{ fontSize: 13, borderBottom: "1px solid #eee", padding: "4px 0" }}>
            {tx.type} · {tx.fromUserId === user.id ? "-" : "+"}${tx.amount} · {tx.description}
            <span style={{ float: "right", color: "#888" }}>{new Date(tx.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notifications Panel ──
function NotificationsPanel({ notifications, unreadCount, onMarkRead, onMarkAllRead }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => { setOpen(!open); if (!open && unreadCount > 0) onMarkAllRead(); }}>
        🔔 {unreadCount > 0 ? `(${unreadCount})` : ""}
      </button>

      {open && (
        <div style={{ position: "absolute", right: 0, background: "#fff", border: "1px solid #ccc", padding: 12, width: 300, zIndex: 100 }}>
          <h4>Уведомления</h4>
          {notifications.length === 0 && <p>Нет уведомлений</p>}
          {notifications.slice(0, 20).map(n => (
            <div
              key={n.id}
              style={{ padding: "6px 0", borderBottom: "1px solid #eee", fontWeight: n.read ? "normal" : "bold", cursor: "pointer" }}
              onClick={() => onMarkRead(n.id)}
            >
              <div>{n.title}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{n.body}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────
//  6. ROOT APP
// ───────────────────────────────────────────

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    seedDemoData(dispatch);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

function AppShell() {
  const { state, dispatch } = useApp();

  const auth       = useAuth(dispatch);
  const listings   = useListings(state, dispatch);
  const bookings   = useBookings(state, dispatch);
  const barter     = useBarter(state, dispatch);
  const profile    = useProfile(state, dispatch);
  const chats      = useChats(state, dispatch);
  const notifs     = useNotifications(state, dispatch);

  const searchResults = listings.searchListings();
  const recommendations = listings.getRecommendations();
  const myListings = listings.getMyListings();
  const myStudentBookings = bookings.getMyBookingsAsStudent();
  const myExpertBookings = bookings.getMyBookingsAsExpert();
  const myBarterOffers = barter.getMyOffers();
  const barterMatches = barter.getBarterMatches();
  const myNotifications = notifs.getMyNotifications();
  const unreadNotifs = notifs.getUnreadCount();
  const myTransactions = profile.getMyTransactions();
  const userStats = profile.getStats();

  if (!state.currentUser) {
    return (
      <AuthScreen
        onLogin={(email, pass) => auth.login(email, pass, state.users)}
        onRegister={auth.register}
        loading={state.ui.loading.auth}
        error={state.ui.errors.auth}
      />
    );
  }

  const tabs = [
    { id: "discover", label: "Найти" },
    { id: "my_learning", label: "Учусь" },
    { id: "my_teaching", label: "Обучаю" },
    { id: "barter", label: "Обмен" },
    { id: "profile", label: "Профиль" },
  ];

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>EdgeFlow</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span>${state.currentUser.balance.toFixed(2)}</span>
          <NotificationsPanel
            notifications={myNotifications}
            unreadCount={unreadNotifs}
            onMarkRead={notifs.markRead}
            onMarkAllRead={notifs.markAllRead}
          />
          <button onClick={auth.logout}>Выйти</button>
        </div>
      </div>

      {/* Errors */}
      {Object.entries(state.ui.errors).map(([key, msg]) => (
        <div key={key} style={{ background: "#fee", padding: 8, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>{msg}</span>
          <button onClick={() => dispatch({ type: "CLEAR_ERROR", payload: key })}>×</button>
        </div>
      ))}

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: t.id })}
            style={{ padding: "6px 12px", background: state.ui.activeTab === t.id ? "#333" : "#eee", color: state.ui.activeTab === t.id ? "#fff" : "#333", border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      {state.ui.activeTab === "discover" && (
        <DiscoverTab
          listings={searchResults}
          users={state.users}
          searchState={state.searchState}
          onSearch={filters => dispatch({ type: "SET_SEARCH_STATE", payload: filters })}
          onViewListing={listings.viewListing}
          onBook={bookings.bookSession}
          currentUser={state.currentUser}
        />
      )}

      {state.ui.activeTab === "my_learning" && (
        <MyLearningTab
          bookings={myStudentBookings}
          listings={state.listings}
          users={state.users}
          onComplete={bookings.completeSession}
          onCancel={(id) => bookings.cancelBooking(id, "Не могу")}
          onReview={bookings.leaveReview}
        />
      )}

      {state.ui.activeTab === "my_teaching" && (
        <MyTeachingTab
          listings={myListings}
          bookings={myExpertBookings}
          onCreateListing={listings.createListing}
          onDeleteListing={listings.deleteListing}
          onCompleteSession={bookings.completeSession}
        />
      )}

      {state.ui.activeTab === "barter" && (
        <BarterTab
          myOffers={myBarterOffers}
          matches={barterMatches}
          users={state.users}
          onCreateOffer={barter.createOffer}
          onAcceptMatch={barter.acceptMatch}
          currentUser={state.currentUser}
        />
      )}

      {state.ui.activeTab === "profile" && (
        <ProfileTab
          user={state.currentUser}
          stats={userStats}
          transactions={myTransactions}
          onUpdateProfile={profile.updateProfile}
          onAddSkill={profile.addSkill}
          onAddWantToLearn={profile.addWantToLearn}
          onVerify={profile.requestVerification}
          onSubscribePro={profile.subscribePro}
          onDeposit={profile.depositBalance}
        />
      )}
    </div>
  );
}

export default function EdgeFlowApp() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
