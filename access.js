'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'access.json');

// Oddiy foydalanuvchi rolini almashtirish oralig‘i.
// Hozircha 30 kun.
// Keyinchalik Super Admin panelidan o‘zgartiramiz.
const ROLE_CHANGE_COOLDOWN_DAYS = 30;

const SUPER_ADMIN = {
  telegramId: '1148401454',
  username: 'jovliyev_bekzod',
  role: 'super_admin'
};

const DEFAULT_DATA = {
  users: {},
  centers: {},
  centerJoinRequests: {},
  roleChangeLogs: [],
  permissions: {},
  botSettings: {
    requiredChannel: '@uzchesara',
    subscriptionRequired: true
  }
};

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(DEFAULT_DATA, null, 2),
      'utf8'
    );
  }
}

function readData() {
  ensureStorage();

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_DATA,
      ...parsed,
      users: parsed.users || {},
      centers: parsed.centers || {},
      centerJoinRequests: parsed.centerJoinRequests || {},
      roleChangeLogs: parsed.roleChangeLogs || [],
      permissions: parsed.permissions || {},
      botSettings: {
        ...DEFAULT_DATA.botSettings,
        ...(parsed.botSettings || {})
      }
    };
  } catch (error) {
    console.error('❌ access.json o‘qilmadi:', error.message);

    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function writeData(data) {
  ensureStorage();

  const tempFile = `${DATA_FILE}.tmp`;

  fs.writeFileSync(
    tempFile,
    JSON.stringify(data, null, 2),
    'utf8'
  );

  fs.renameSync(tempFile, DATA_FILE);
}

function normalizeTelegramId(value) {
  return String(value || '').trim();
}

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .replace(/^@/, '')
    .toLowerCase();
}

function isSuperAdmin(userOrTelegramId) {
  if (
    userOrTelegramId &&
    typeof userOrTelegramId === 'object'
  ) {
    const telegramId = normalizeTelegramId(
      userOrTelegramId.telegramId ||
      userOrTelegramId.id
    );

    const username = normalizeUsername(
      userOrTelegramId.username
    );

    return (
      telegramId === SUPER_ADMIN.telegramId ||
      username === SUPER_ADMIN.username
    );
  }

  return (
    normalizeTelegramId(userOrTelegramId) ===
    SUPER_ADMIN.telegramId
  );
}

function defaultPermissions() {
  return {
    users: true,
    teachers: true,
    students: true,
    parents: true,
    centers: true,
    courses: true,
    groups: true,
    lessons: true,
    attendance: true,
    reports: true,
    tournaments: true,
    analysis: true,
    menus: true,
    menuTexts: true,
    botTexts: true,
    subscription: true,
    channels: true,
    settings: true
  };
}

function ensureSuperAdmin(data) {
  const key = SUPER_ADMIN.telegramId;

  if (!data.users[key]) {
    data.users[key] = {
      telegramId: key,
      username: SUPER_ADMIN.username,
      firstName: 'Bekzod',
      role: SUPER_ADMIN.role,
      roleSelectedAt: new Date().toISOString(),
      roleLastChangedAt: null,
      centerId: null,
      teacherType: null,
      status: 'active',
      createdAt: new Date().toISOString()
    };
  } else {
    data.users[key].username =
      SUPER_ADMIN.username;

    data.users[key].role =
      SUPER_ADMIN.role;

    data.users[key].status =
      'active';
  }

  data.permissions[key] =
    defaultPermissions();
}

function getUser(telegramId) {
  const data = readData();

  ensureSuperAdmin(data);
  writeData(data);

  return (
    data.users[
      normalizeTelegramId(telegramId)
    ] || null
  );
}

function getOrCreateUser({
  telegramId,
  username,
  firstName,
  lastName
}) {
  const id = normalizeTelegramId(telegramId);

  if (!id) {
    throw new Error(
      'Telegram ID mavjud emas.'
    );
  }

  const data = readData();

  ensureSuperAdmin(data);

  if (!data.users[id]) {
    data.users[id] = {
      telegramId: id,
      username:
        normalizeUsername(username) || null,
      firstName:
        firstName || '',
      lastName:
        lastName || '',
      role: null,
      roleSelectedAt: null,
      roleLastChangedAt: null,
      centerId: null,
      teacherType: null,
      status: 'active',
      createdAt: new Date().toISOString()
    };
  } else {
    data.users[id].username =
      normalizeUsername(username) ||
      data.users[id].username ||
      null;

    if (firstName) {
      data.users[id].firstName =
        firstName;
    }

    if (lastName) {
      data.users[id].lastName =
        lastName;
    }
  }

  if (id === SUPER_ADMIN.telegramId) {
    data.users[id].role =
      SUPER_ADMIN.role;

    data.users[id].username =
      SUPER_ADMIN.username;
  }

  writeData(data);

  return data.users[id];
}

function setRole(
  telegramId,
  role,
  extra = {}
) {
  const id = normalizeTelegramId(telegramId);

  const allowedRoles = [
    'parent',
    'student',
    'teacher'
  ];

  if (!allowedRoles.includes(role)) {
    throw new Error(
      'Noto‘g‘ri rol.'
    );
  }

  const data = readData();

  ensureSuperAdmin(data);

  if (!data.users[id]) {
    data.users[id] = {
      telegramId: id,
      username: null,
      firstName: '',
      lastName: '',
      role: null,
      roleSelectedAt: null,
      roleLastChangedAt: null,
      centerId: null,
      teacherType: null,
      status: 'active',
      createdAt: new Date().toISOString()
    };
  }

  const user = data.users[id];

  // Super Admin uchun cheklov yo‘q.
  if (isSuperAdmin(id)) {
    user.role = SUPER_ADMIN.role;
    user.roleSelectedAt =
      user.roleSelectedAt ||
      new Date().toISOString();

    writeData(data);

    return {
      success: true,
      user,
      isSuperAdmin: true
    };
  }

  // Birinchi rol tanlanishi.
  if (!user.role) {
    user.role = role;
    user.roleSelectedAt =
      new Date().toISOString();

    if (extra.teacherType) {
      user.teacherType =
        extra.teacherType;
    }

    if (extra.centerId) {
      user.centerId =
        extra.centerId;
    }

    writeData(data);

    return {
      success: true,
      firstSelection: true,
      user
    };
  }

  // Eski rol bilan bir xil bo‘lsa.
  if (user.role === role) {
    return {
      success: false,
      reason: 'same_role',
      message:
        'Siz allaqachon shu roldasiz.',
      user
    };
  }

  return canChangeRole(id)
    ? changeExistingRole(
        id,
        role,
        extra
      )
    : {
        success: false,
        reason: 'cooldown',
        message:
          getRoleChangeMessage(user),
        user
      };
}

function canChangeRole(telegramId) {
  const id =
    normalizeTelegramId(telegramId);

  if (isSuperAdmin(id)) {
    return true;
  }

  const data = readData();
  const user = data.users[id];

  if (!user || !user.role) {
    return true;
  }

  if (!user.roleLastChangedAt) {
    // Birinchi rol tanlangan bo‘lsa,
    // undan keyin cooldown boshlanadi.
    if (!user.roleSelectedAt) {
      return true;
    }

    const elapsed =
      Date.now() -
      new Date(
        user.roleSelectedAt
      ).getTime();

    const cooldown =
      ROLE_CHANGE_COOLDOWN_DAYS *
      24 *
      60 *
      60 *
      1000;

    return elapsed >= cooldown;
  }

  const elapsed =
    Date.now() -
    new Date(
      user.roleLastChangedAt
    ).getTime();

  const cooldown =
    ROLE_CHANGE_COOLDOWN_DAYS *
    24 *
    60 *
    60 *
    1000;

  return elapsed >= cooldown;
}

function getNextRoleChangeDate(user) {
  const baseDate =
    user.roleLastChangedAt ||
    user.roleSelectedAt;

  if (!baseDate) {
    return null;
  }

  const date =
    new Date(baseDate);

  date.setDate(
    date.getDate() +
    ROLE_CHANGE_COOLDOWN_DAYS
  );

  return date;
}

function getRoleChangeMessage(user) {
  const nextDate =
    getNextRoleChangeDate(user);

  if (!nextDate) {
    return 'Rolni hozir almashtirish mumkin.';
  }

  return [
    '🔒 Rolni hozircha almashtirib bo‘lmaydi.',
    '',
    `📅 Keyingi almashtirish: ${nextDate.toLocaleDateString('uz-UZ')}`,
    '',
    'Agar rolni hozir almashtirish zarur bo‘lsa,',
    'Super Admin bilan bog‘laning.'
  ].join('\n');
}

function changeExistingRole(
  telegramId,
  newRole,
  extra = {}
) {
  const data = readData();

  const user =
    data.users[
      normalizeTelegramId(telegramId)
    ];

  if (!user) {
    return {
      success: false,
      reason: 'not_found',
      message:
        'Foydalanuvchi topilmadi.'
    };
  }

  const oldRole =
    user.role;

  user.role =
    newRole;

  user.roleLastChangedAt =
    new Date().toISOString();

  if (extra.teacherType !== undefined) {
    user.teacherType =
      extra.teacherType;
  }

  if (extra.centerId !== undefined) {
    user.centerId =
      extra.centerId;
  }

  data.roleChangeLogs.push({
    id: crypto.randomUUID(),
    telegramId:
      user.telegramId,
    oldRole,
    newRole,
    changedAt:
      new Date().toISOString(),
    changedBy:
      isSuperAdmin(telegramId)
        ? SUPER_ADMIN.telegramId
        : user.telegramId
  });

  writeData(data);

  return {
    success: true,
    firstSelection: false,
    user
  };
}

function getRole(telegramId) {
  const user =
    getUser(telegramId);

  return user?.role || null;
}

function getPermissions(telegramId) {
  const data = readData();

  if (isSuperAdmin(telegramId)) {
    return defaultPermissions();
  }

  return (
    data.permissions[
      normalizeTelegramId(telegramId)
    ] || {}
  );
}

function hasPermission(
  telegramId,
  permission
) {
  if (isSuperAdmin(telegramId)) {
    return true;
  }

  const permissions =
    getPermissions(telegramId);

  return permissions[permission] === true;
}

function createCenter({
  name,
  ownerTelegramId,
  description = ''
}) {
  if (!name) {
    throw new Error(
      'Markaz nomi kerak.'
    );
  }

  const data = readData();

  const id =
    crypto.randomUUID();

  data.centers[id] = {
    id,
    name: String(name).trim(),
    description,
    ownerTelegramId:
      normalizeTelegramId(
        ownerTelegramId
      ),
    status: 'active',
    createdAt:
      new Date().toISOString()
  };

  writeData(data);

  return data.centers[id];
}

function getCenters() {
  const data = readData();

  return Object.values(
    data.centers
  ).filter(
    center =>
      center.status !== 'deleted'
  );
}

function getCenter(centerId) {
  const data = readData();

  return (
    data.centers[centerId] ||
    null
  );
}

function requestCenterJoin({
  telegramId,
  centerId
}) {
  const data = readData();

  const userId =
    normalizeTelegramId(telegramId);

  const center =
    data.centers[centerId];

  if (!center) {
    return {
      success: false,
      message:
        'Markaz topilmadi.'
    };
  }

  const requestId =
    crypto.randomUUID();

  data.centerJoinRequests[
    requestId
  ] = {
    id: requestId,
    telegramId: userId,
    centerId,
    status: 'pending',
    createdAt:
      new Date().toISOString()
  };

  writeData(data);

  return {
    success: true,
    request:
      data.centerJoinRequests[
        requestId
      ]
  };
}

function approveCenterJoin(
  requestId,
  approvedBy
) {
  const data = readData();

  const request =
    data.centerJoinRequests[
      requestId
    ];

  if (!request) {
    return {
      success: false,
      message:
        'So‘rov topilmadi.'
    };
  }

  const allowed =
    isSuperAdmin(approvedBy);

  if (!allowed) {
    return {
      success: false,
      message:
        'Bu amal uchun ruxsat yo‘q.'
    };
  }

  request.status =
    'approved';

  request.approvedBy =
    normalizeTelegramId(
      approvedBy
    );

  request.approvedAt =
    new Date().toISOString();

  if (data.users[request.telegramId]) {
    data.users[
      request.telegramId
    ].centerId =
      request.centerId;
  }

  writeData(data);

  return {
    success: true,
    request
  };
}

function setIndependentTeacher(
  telegramId
) {
  const data = readData();

  const id =
    normalizeTelegramId(
      telegramId
    );

  if (!data.users[id]) {
    return {
      success: false,
      message:
        'Foydalanuvchi topilmadi.'
    };
  }

  data.users[id].role =
    'teacher';

  data.users[id].teacherType =
    'independent';

  data.users[id].centerId =
    null;

  writeData(data);

  return {
    success: true,
    user:
      data.users[id]
  };
}

function setCenterTeacher(
  telegramId,
  centerId
) {
  const data = readData();

  const id =
    normalizeTelegramId(
      telegramId
    );

  if (!data.users[id]) {
    return {
      success: false,
      message:
        'Foydalanuvchi topilmadi.'
    };
  }

  if (!data.centers[centerId]) {
    return {
      success: false,
      message:
        'Markaz topilmadi.'
    };
  }

  data.users[id].role =
    'teacher';

  data.users[id].teacherType =
    'center';

  data.users[id].centerId =
    centerId;

  writeData(data);

  return {
    success: true,
    user:
      data.users[id]
  };
}

function getAllUsers() {
  const data = readData();

  return Object.values(
    data.users
  );
}

module.exports = {
  SUPER_ADMIN,
  ROLE_CHANGE_COOLDOWN_DAYS,

  getUser,
  getOrCreateUser,

  isSuperAdmin,

  setRole,
  getRole,

  canChangeRole,
  getNextRoleChangeDate,
  getRoleChangeMessage,

  getPermissions,
  hasPermission,

  createCenter,
  getCenters,
  getCenter,

  requestCenterJoin,
  approveCenterJoin,

  setIndependentTeacher,
  setCenterTeacher,

  getAllUsers
};
