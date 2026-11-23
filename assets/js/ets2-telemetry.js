/* Copyright (c) 2026 FooZzee. All Rights Reserved. Licensed under Proprietary Freeware License. */
/**
 * Модуль телеметрии кабины ETS2 / ATS (overlayobs_foozzee_telemetry.dll SCS SDK 1.16 Shared Memory -> HTTP 30002),
 * локализации RU/EN, синхронизации config.js, 2-рядной торпеды и тестового режима (?test=1).
 */
(function initETS2Telemetry(global) {
  'use strict';

  const app = global.ETS2Overlay;
  if (!app) return;

  const { config, isTestMode, showGuides, escapeHtml, log } = app;
  const lang = app.lang === 'en' ? 'en' : 'ru';

  const OVERLAY_VERSION = 'v0.0.2';
  const UPDATE_CACHE_KEY = 'obs_overlay_update_cache';
  const UPDATE_CACHE_TTL_MS = 10800000; // 3 часа между запросами к GitHub API

  const I18N = {
    ru: {
      days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      realEtaLabel: 'РЕАЛЬНОЕ ВРЕМЯ В ПУТИ:',
      kmh: 'КМ/Ч',
      mph: 'МИЛЬ/Ч',
      km: 'КМ',
      m: 'М',
      l: 'Л',
      l100: 'Л/100КМ',
      l100Short: 'Л/100',
      t: 'Т',
      min: 'МИН',
      h: 'Ч',
      hShort: 'ч',
      mShort: 'м',
      barUnit: 'бар',
      voltUnit: 'В',
      rpm: 'ОБ/МИН',
      rpmStandby: '-- ОБ/МИН',
      cruisePill: 'КК',
      cruiseStandby: 'КК --',
      cruiseOn: 'КК ВКЛ',
      fuel: 'ТОПЛИВО',
      range: 'ЗАПАС ХОДА',
      fuelAvg: 'РАСХОД',
      oilWater: 'МАСЛО/ВОДА',
      air: 'ВОЗДУХ',
      adblue: 'МОЧЕВИНА',
      battery: 'АКБ',
      route: 'МАРШРУТ',
      trailer: 'ПРИЦЕП',
      throttle: 'ГАЗ',
      brake: 'ТОРМ',
      steer: 'РУЛЬ',
      camTitle: 'КАМЕРА // FOOZZEE',
      camPrefix: 'КАМЕРА',
      cbDefault: 'РАЦИЯ 19',
      chatTitle: 'РАЦИЯ // ЧАТ',
      chatLive: 'TWITCH // В ЭФИРЕ',
      chatTest: 'ТЕСТ // В ЭФИРЕ',
      chatStandby: 'ОЖИДАНИЕ',
      chatOnline: 'В СЕТИ',
      chatOffline: 'НЕ В СЕТИ',
      chatConnecting: 'ПОДКЛЮЧЕНИЕ',
      driverPrefix: 'ВОДИТЕЛЬ',
      driverPill: 'ВОДИТЕЛЬ: FOOZZEE',
      liveRouteTag: 'ЭФИР // МАРШРУТ',
      truckPrefix: 'СОСТ:',
      trailerPrefix: 'ПРИЦЕП:',
      cargoPrefix: 'ГРУЗ:',
      truckStandby: 'ТЯГАЧ // ОЖИДАНИЕ',
      freeRoam: 'СВОБОДНЫЙ РЕЙС',
      freightJob: 'ГРУЗОВОЙ РЕЙС',
      freightJobTitle: 'Грузовой рейс',
      trailerAttachedEmpty: 'С ПРИЦЕПОМ (ПУСТОЙ)',
      noTrailer: 'БЕЗ ПРИЦЕПА',
      coachPassengerRoute: 'ПАССАЖИРСКИЙ РЕЙС',
      coachPassengerTitle: 'Пассажирский рейс DLC Coaches',
      comfortLabel: 'КОМФОРТ',
      gpsRouteNextStop: 'МАРШРУТ GPS // СЛЕДУЮЩАЯ ОСТАНОВКА',
      gpsRouteTitle: 'Навигация по маршруту GPS',
      statusInTransit: 'В РЕЙСЕ // В ЭФИРЕ',
      statusFreeRoam: 'СВОБОДНАЯ ЕЗДА // В СЕТИ',
      statusPaused: 'ПАУЗА // В МЕНЮ',
      statusStandby: 'ОЖИДАНИЕ // ОФЛАЙН',
      enRouteMeta: 'В РЕЙСЕ',
      liveMeta: 'В ЭФИРЕ',
      tickerIncome: 'ОПЛАТА:',
      tickerCompanies: 'КОМПАНИИ:',
      tickerJobType: 'ТИП ЗАКАЗА:',
      tickerTripDist: 'ПРОЙДЕНО ЗА РЕЙС:',
      tickerFuelUsed: 'СОЖЖЕНО:',
      tickerTripAvg: 'СРЕДНИЙ РАСХОД:',
      tickerMaxSpeed: 'МАКС. СКОРОСТЬ:',
      tickerRemDist: 'ОСТАЛОСЬ:',
      tickerRadio: 'РАЦИЯ:',
      tickerMusic: 'МУЗЫКА:',
      tickerStream: 'СТРИМ:',
      tickerClock: 'ВРЕМЯ:',
      mfdAirNorm: 'ПНЕВМО',
      gearModeAuto: 'AUTO',
      gearModeManual: 'MAN',
      gearModeNeutral: 'NEUT',
      gearModeReverse: 'REV',
      noTelemetryTitle: 'Нет связи с телеметрией',
      trailerEmptyTitle: 'Прицеп подключён (без груза)',
      noTrailerTitle: 'Прицеп не подключён',
      noRouteTitle: 'Маршрут не задан',
      truckHealthTitle: 'Техническое состояние тягача',
      trailerHealthTitle: 'Техническое состояние прицепа',
      cargoHealthTitle: 'Сохранность груза',
      jobMarkets: {
        freight_market: 'ПРЯМЫЕ ПЕРЕВОЗКИ',
        cargo_market: 'БИРЖА ГРУЗОВ',
        quick_job: 'АГЕНТСТВО',
        external_contracts: 'ВНЕШНИЕ КОНТРАКТЫ',
        external_market: 'ВНЕШНИЙ РЫНОК',
        special_transport: 'СПЕЦТРАНСПОРТ',
        owned_trailer: 'СВОЙ ПРИЦЕП',
        bus_job: 'РЕЙСОВЫЙ АВТОБУС',
        coach: 'РЕЙСОВЫЙ АВТОБУС',
        dispatch_job: 'ДИСПЕТЧЕРСКИЙ РЕЙС'
      },
      eventCategoryFine: 'ШТРАФ // ПОЛИЦИЯ',
      eventCategoryToll: 'ОПЛАТА ДОРОГИ',
      eventCategoryRefuel: 'ДОЗАПРАВКА ТОПЛИВА',
      eventCategoryFerry: 'МОРСКАЯ ПЕРЕПРАВА',
      eventCategoryTrain: 'Ж/Д ПЕРЕПРАВА',
      eventCategoryJobDelivered: 'РЕЙС ЗАВЕРШЁН',
      eventCategoryJobCancelled: 'РЕЙС АННУЛИРОВАН',
      eventCategoryCargoDamage: 'ПОВРЕЖДЕНИЕ ГРУЗА',
      eventCargoDamageTitle: 'Зафиксирован урон груза',
      eventCategoryService: 'ТЕХОБСЛУЖИВАНИЕ',
      eventServiceTitle: 'Ремонт и обслуживание завершены',
      eventServiceValue: 'Восстановлено 100%',
      eventCategoryLowFuel: 'РЕЗЕРВ ТОПЛИВА',
      eventLowFuelTitle: 'Низкий остаток топлива',
      eventCategoryBusStop: 'ПАССАЖИРСКИЙ РЕЙС',
      eventBusStopTitle: 'Остановка // Посадка пассажиров',
      eventCategoryBusComfort: 'КОМФОРТ ПАССАЖИРОВ',
      eventBusComfortTitle: 'Резкое падение комфорта',
      eventBusComfortUpTitle: 'Комфорт пассажиров повышен',
      eventCategoryChatHonk: 'ИНТЕРАКТИВНЫЙ КЛАКСОН',
      eventChatHonkTitle: 'Приветственный гудок',
      eventChatHonkValue: 'Пневмосигнал тягача',
      eventCategoryChatCb: '15 КАНАЛ // РАЦИЯ СИ-БИ',
      eventCategoryChatRoute: 'GPS // ТЕКУЩИЙ МАРШРУТ',
      eventCategoryChatStats: 'СТАТИСТИКА СТРИМА',
      eventCategoryChatTruck: 'ТЯГАЧ // СОСТАВ',
      eventCategoryChatDriver: 'ВОДИТЕЛЬ // ДОСЬЕ',
      eventCategoryUpdate: 'СИСТЕМА // ОБНОВЛЕНИЕ',
      eventUpdateTitle: 'ДОСТУПНА ВЕРСИЯ',
      eventUpdateDesc: 'Запустите Update-Overlay.bat для установки',
      eventUpdateCurrent: 'Текущая версия:',
      eventSummaryRoute: 'Маршрут:',
      eventSummaryDistance: 'Пройдено:',
      eventSummaryRevenue: 'Оплата:',
      eventSummaryXP: 'Опыт:',
      eventSummaryFines: 'Штрафы:',
      eventSummaryBetsWon: 'Ставки зашли:',
      eventSummaryNoBets: 'Ставок не было',
      badgeFine: 'ШТРАФ',
      badgeToll: 'ОПЛАТА',
      badgeFuel: 'АЗС',
      badgeFerry: 'ПАРОМ',
      badgeTrain: 'ПОЕЗД',
      badgeDelivered: 'КОНТРАКТ',
      badgeCancelled: 'ОТМЕНА',
      badgeDamage: 'ГРУЗ',
      badgeService: 'СТО',
      badgeLowFuel: 'РЕЗЕРВ',
      badgeCoach: 'АВТОБУС',
      badgeComfort: 'КОМФОРТ',
      badgeComfortDown: '-КОМФОРТ',
      badgeComfortUp: '+КОМФОРТ',
      badgeHonk: 'СИГНАЛ',
      badgeRadio: 'РАЦИЯ',
      badgeChat: 'ЧАТ',
      badgeTruck: 'ТЯГАЧ',
      badgeDriver: 'ВОДИТЕЛЬ',
      badgeStats: 'СТАТИСТИКА',
      badgeRoute: 'МАРШРУТ',
      badgeWinners: 'ПОБЕДИТЕЛИ',
      eventFineSpeeding: 'Превышение скорости',
      eventFineSpeedingCamera: 'Камера контроля скорости',
      eventFineRedSignal: 'Проезд на красный свет',
      eventFineCrash: 'ДТП // Столкновение',
      eventFineNoLights: 'Движение без фар',
      eventFineAvoidSleeping: 'Нарушение режима отдыха',
      eventFineWrongWay: 'Движение по встречной полосе',
      eventFineAvoidWeighing: 'Пропуск весового контроля',
      eventFineIllegalTrailer: 'Неразрешённый прицеп',
      eventFineAvoidInspection: 'Пропуск инспекции',
      eventFineIllegalBorderCrossing: 'Нарушение пограничного контроля',
      eventFineHardShoulderViolation: 'Движение по обочине',
      eventFineDamagedVehicleUsage: 'Критическая неисправность ТС',
      eventFineGeneric: 'Дорожный штраф',
      eventTollTitle: 'Платная автомагистраль',
      eventRefuelTitle: 'Заправка завершена',
      eventFerryTitle: 'Паромная переправа',
      eventTrainTitle: 'Железнодорожная переправа',
      eventJobDeliveredTitle: 'Груз успешно доставлен',
      eventJobCancelledTitle: 'Контракт аннулирован',
      eventBusJobDeliveredTitle: 'Пассажирский рейс завершён',
      eventBusJobCancelledTitle: 'Пассажирский рейс отменён'
    },
    en: {
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      realEtaLabel: 'REAL TIME EN ROUTE:',
      kmh: 'KM/H',
      mph: 'MPH',
      km: 'KM',
      m: 'M',
      l: 'L',
      l100: 'L/100KM',
      l100Short: 'L/100',
      t: 'T',
      min: 'MIN',
      h: 'H',
      hShort: 'h',
      mShort: 'm',
      barUnit: 'bar',
      voltUnit: 'V',
      rpm: 'RPM',
      rpmStandby: '-- RPM',
      cruisePill: 'CC',
      cruiseStandby: 'CC --',
      cruiseOn: 'CC ON',
      fuel: 'FUEL',
      range: 'RANGE',
      fuelAvg: 'FUEL AVG',
      oilWater: 'OIL/WATER',
      air: 'AIR',
      adblue: 'ADBLUE',
      battery: 'BATTERY',
      route: 'ROUTE',
      trailer: 'TRAILER',
      throttle: 'THR',
      brake: 'BRK',
      steer: 'STR',
      camTitle: 'CAM // FOOZZEE',
      camPrefix: 'CAM',
      cbDefault: 'CB 19',
      chatTitle: 'COMMS // CHAT',
      chatLive: 'TWITCH // LIVE',
      chatTest: 'TEST // LIVE',
      chatStandby: 'STANDBY',
      chatOnline: 'ONLINE',
      chatOffline: 'OFFLINE',
      chatConnecting: 'CONNECTING',
      driverPrefix: 'DRIVER',
      driverPill: 'DRIVER: FOOZZEE',
      liveRouteTag: 'LIVE // ROUTE',
      truckPrefix: 'TRUCK:',
      trailerPrefix: 'TRAILER:',
      cargoPrefix: 'CARGO:',
      truckStandby: 'TRUCK // STANDBY',
      freeRoam: 'FREE ROAM',
      freightJob: 'FREIGHT',
      freightJobTitle: 'Freight cargo trip',
      trailerAttachedEmpty: 'TRAILER ATTACHED (EMPTY)',
      noTrailer: 'NO TRAILER',
      coachPassengerRoute: 'PASSENGERS',
      coachPassengerTitle: 'DLC Coaches passenger route',
      comfortLabel: 'SATISFACTION',
      gpsRouteNextStop: 'GPS ROUTE // NEXT STOP',
      gpsRouteTitle: 'Active GPS route navigation',
      statusInTransit: 'IN TRANSIT // LIVE',
      statusFreeRoam: 'FREE ROAM // ONLINE',
      statusPaused: 'PAUSED // IN MENU',
      statusStandby: 'STANDBY // OFFLINE',
      enRouteMeta: 'EN ROUTE',
      liveMeta: 'LIVE',
      tickerIncome: 'INCOME:',
      tickerCompanies: 'COMPANIES:',
      tickerJobType: 'JOB TYPE:',
      tickerTripDist: 'TRIP DISTANCE:',
      tickerFuelUsed: 'FUEL USED:',
      tickerTripAvg: 'TRIP AVG:',
      tickerMaxSpeed: 'MAX SPEED:',
      tickerRemDist: 'REMAINING:',
      tickerRadio: 'CB RADIO:',
      tickerMusic: 'MUSIC:',
      tickerStream: 'STREAM:',
      tickerClock: 'TIME:',
      mfdAirNorm: 'AIR SYS',
      gearModeAuto: 'AUTO',
      gearModeManual: 'MAN',
      gearModeNeutral: 'NEUT',
      gearModeReverse: 'REV',
      noTelemetryTitle: 'No telemetry connection',
      trailerEmptyTitle: 'Trailer attached (empty)',
      noTrailerTitle: 'No trailer attached',
      noRouteTitle: 'No active route',
      truckHealthTitle: 'Truck condition',
      trailerHealthTitle: 'Trailer condition',
      cargoHealthTitle: 'Cargo integrity',
      jobMarkets: {
        freight_market: 'FREIGHT MARKET',
        cargo_market: 'CARGO MARKET',
        quick_job: 'QUICK JOB',
        external_contracts: 'EXTERNAL CONTRACTS',
        external_market: 'EXTERNAL MARKET',
        special_transport: 'SPECIAL TRANSPORT',
        owned_trailer: 'OWNED TRAILER',
        bus_job: 'COACH ROUTE',
        coach: 'COACH ROUTE',
        dispatch_job: 'DISPATCH JOB'
      },
      eventCategoryFine: 'TRAFFIC FINE // POLICE',
      eventCategoryToll: 'TOLL PAYMENT',
      eventCategoryRefuel: 'REFUELING // STATION',
      eventCategoryFerry: 'FERRY TRANSIT',
      eventCategoryTrain: 'TRAIN TRANSIT',
      eventCategoryJobDelivered: 'JOB DELIVERED',
      eventCategoryJobCancelled: 'JOB CANCELLED',
      eventCategoryCargoDamage: 'CARGO DAMAGE',
      eventCargoDamageTitle: 'Cargo Damage Detected',
      eventCategoryService: 'VEHICLE SERVICE',
      eventServiceTitle: 'Repair & Service Completed',
      eventServiceValue: 'Restored 100%',
      eventCategoryLowFuel: 'LOW FUEL RESERVE',
      eventLowFuelTitle: 'Low Fuel Warning',
      eventCategoryBusStop: 'PASSENGER COACH',
      eventBusStopTitle: 'Bus Stop // Boarding',
      eventCategoryBusComfort: 'PASSENGER COMFORT',
      eventBusComfortTitle: 'Comfort Rating Drop',
      eventBusComfortUpTitle: 'Passenger Comfort Increased',
      eventCategoryChatHonk: 'INTERACTIVE AIR HORN',
      eventChatHonkTitle: 'Horn Greeting',
      eventChatHonkValue: 'Truck Pneumatic Horn',
      eventCategoryChatCb: 'CH 15 // CB RADIO',
      eventCategoryChatRoute: 'GPS // CURRENT ROUTE',
      eventCategoryChatStats: 'STREAM SESSION STATS',
      eventCategoryChatTruck: 'TRUCK // FLEET',
      eventCategoryChatDriver: 'DRIVER // DOSSIER',
      eventCategoryUpdate: 'SYSTEM // FIRMWARE',
      eventUpdateTitle: 'UPDATE AVAILABLE',
      eventUpdateDesc: 'Run Update-Overlay.bat to install latest version',
      eventUpdateCurrent: 'Current version:',
      eventSummaryRoute: 'Route:',
      eventSummaryDistance: 'Distance:',
      eventSummaryRevenue: 'Payment:',
      eventSummaryXP: 'XP:',
      eventSummaryFines: 'Fines:',
      eventSummaryBetsWon: 'Won Bets:',
      eventSummaryNoBets: 'No bets placed',
      badgeFine: 'FINE',
      badgeToll: 'TOLL',
      badgeFuel: 'FUEL',
      badgeFerry: 'FERRY',
      badgeTrain: 'TRAIN',
      badgeDelivered: 'CONTRACT',
      badgeCancelled: 'CANCEL',
      badgeDamage: 'CARGO',
      badgeService: 'SERVICE',
      badgeLowFuel: 'RESERVE',
      badgeCoach: 'COACH',
      badgeComfort: 'COMFORT',
      badgeComfortDown: '-COMFORT',
      badgeComfortUp: '+COMFORT',
      badgeHonk: 'HORN',
      badgeRadio: 'CB RADIO',
      badgeChat: 'CHAT',
      badgeTruck: 'TRUCK',
      badgeDriver: 'DRIVER',
      badgeStats: 'STATS',
      badgeRoute: 'GPS',
      badgeWinners: 'WINNERS',
      eventFineSpeeding: 'Speeding Violation',
      eventFineSpeedingCamera: 'Speed Camera Violation',
      eventFineRedSignal: 'Red Light Violation',
      eventFineCrash: 'Vehicle Collision',
      eventFineNoLights: 'Driving Without Lights',
      eventFineAvoidSleeping: 'Fatigue / Rest Violation',
      eventFineWrongWay: 'Wrong Way Driving',
      eventFineAvoidWeighing: 'Weigh Station Avoided',
      eventFineIllegalTrailer: 'Illegal Trailer',
      eventFineAvoidInspection: 'Inspection Avoided',
      eventFineIllegalBorderCrossing: 'Border Control Violation',
      eventFineHardShoulderViolation: 'Hard Shoulder Violation',
      eventFineDamagedVehicleUsage: 'Damaged Vehicle',
      eventFineGeneric: 'Traffic Violation',
      eventTollTitle: 'Highway Toll Paid',
      eventRefuelTitle: 'Refueling Completed',
      eventFerryTitle: 'Ferry Transit',
      eventTrainTitle: 'Train Transit',
      eventJobDeliveredTitle: 'Cargo Delivered',
      eventJobCancelledTitle: 'Contract Cancelled',
      eventBusJobDeliveredTitle: 'Bus Tour Completed',
      eventBusJobCancelledTitle: 'Bus Tour Cancelled'
    }
  };

  function t(key) {
    const dict = I18N[lang] || I18N.ru;
    return dict[key] !== undefined ? dict[key] : (I18N.ru[key] ?? key);
  }

  const ATS_BRANDS = [
    'kenworth',
    'peterbilt',
    'mack',
    'freightliner',
    'western star',
    'international'
  ];

  const DEFAULT_TELEMETRY_STALE_MS = 9000;
  const MIN_TELEMETRY_STALE_MS = 8000;
  const TELEMETRY_RETAIN_KEYS = [
    'game', 'paused',
    'speed', 'speedLimit', 'cruise', 'rpm', 'engineRpm', 'rpmLimit', 'gear', 'dgear', 'displayedGear',
    'fuel', 'fuelCap', 'fuelRange', 'scale',
    'truckBrand', 'truckName', 'licensePlate',
    'odometer', 'fuelAvg', 'oilTemp', 'waterTemp', 'air', 'adblue', 'battery',
    'wEngine', 'wTrans', 'wChassis', 'wWheels', 'wCabin', 'wTrailer',
    'cargoDmg', 'jobDmg'
  ];

  let clockTimer = null;
  let telemetryTimer = null;
  let musicTimer = null;
  let socialsTimer = null;
  let leavingTimer = null;
  let demoTimers = [];
  let lastClockText = '';
  let socialIndex = 0;
  let isPageClosed = false;

  let hasEverReceivedLivePacket = false;
  let telemetryPollInFlight = false;
  let telemetryMissCount = 0;
  let lastValidTelemetryPacket = null;
  let lastFreshTelemetryAt = 0;
  let bridgeOfflineNotified = false;
  let stickySpeedUnit = null; // 'ms' | 'kmh' для автоопределения единиц скорости
  let lastHazardLiveBlinkAt = 0;

  const tickerNodeCache = new Map();
  const lastTickerValues = Object.create(null);
  const topTickerNodeCache = new Map();
  const lastTopTickerValues = Object.create(null);
  const urlSearchParams = new URLSearchParams(global.location.search);
  const initialUnitParam = (urlSearchParams.get('units') || '').trim().toLowerCase();
  let forcedSpeedDisplayUnit = (initialUnitParam === 'mph' || initialUnitParam === 'kmh')
    ? initialUnitParam
    : null;

  const SAMPLE_CHAT_POOL_RU = [
    { platform: 'twitch', role: 'MOD', username: 'Alex_Trucker', color: '#ff9e1b', text: 'Отличный маршрут по автобану! Какой груз везёшь до Праги?' },
    { platform: 'twitch', role: 'VIP', username: 'DimaVolga', color: '#38bdf8', text: 'Картинка супер, панель вообще не перекрывает зеркала F2!' },
    { platform: 'twitch', role: 'SUB', username: 'Ksenia_Road', color: '#22c55e', text: 'Всем хорошего рейса и зелёных светофоров без штрафов' },
    { platform: 'vk', role: '', username: 'Sergey_48RU', color: '#93c5fd', text: 'Scania на подъёме уверенно тянет, сколько тонн в прицепе?' },
    { platform: 'twitch', role: '', username: 'Maverick_ETS', color: '#f59e0b', text: 'Круиз на 85 и погнали до разгрузки до заката!' },
    { platform: 'twitch', role: 'SUB', username: 'NordicHaul', color: '#86efac', text: 'Звук турбины и музыка в кабине прям кайф 🔥' }
  ];

  const SAMPLE_CHAT_POOL_EN = [
    { platform: 'twitch', role: 'MOD', username: 'Alex_Trucker', color: '#ff9e1b', text: 'Great highway route! What cargo are you hauling to Prague?' },
    { platform: 'twitch', role: 'VIP', username: 'HighwayKing', color: '#38bdf8', text: 'Layout is awesome, overlay does not block F2 mirrors at all!' },
    { platform: 'twitch', role: 'SUB', username: 'Sarah_Hauler', color: '#22c55e', text: 'Have a smooth haul everyone and keep the rubber side down!' },
    { platform: 'twitch', role: '', username: 'PeterbiltFan', color: '#93c5fd', text: 'Scania pulls uphill with ease, how many tons are in the trailer?' },
    { platform: 'twitch', role: '', username: 'Maverick_ETS', color: '#f59e0b', text: 'Cruise at 85 and let us roll into the sunset!' },
    { platform: 'twitch', role: 'SUB', username: 'NordicHaul', color: '#86efac', text: 'Turbo spool and cabin sound are so satisfying 🔥' }
  ];

  const SAMPLE_CHAT_POOL = lang === 'en' ? SAMPLE_CHAT_POOL_EN : SAMPLE_CHAT_POOL_RU;

  const SAMPLE_ALERTS = {
    donate: {
      type: 'donate',
      username: lang === 'en' ? 'Daniel_Trucker' : 'Даниил_Дальнобой',
      amount: lang === 'en' ? 10 : 500,
      currency: lang === 'en' ? '$' : '₽',
      message: lang === 'en'
        ? 'For a full diesel tank and endless coffee on the night highway!'
        : 'На полный бак дизеля и безлимитный кофе на ночной трассе!',
      force: true
    },
    sub: {
      type: 'sub',
      username: 'Ksenia_Road',
      months: 6,
      tier: 'TIER 1',
      message: lang === 'en'
        ? 'Renewed trucker license for 6 months!'
        : 'Продлила лицензию дальнобойщика на 6 месяцев!',
      force: true
    },
    follow: {
      type: 'follow',
      username: 'Pavel_FH16',
      force: true
    },
    raid: {
      type: 'raid',
      username: 'ConvoyMasters',
      viewers: 48,
      force: true
    }
  };

  const SAMPLE_TELEMETRY_PACKET = {
    game: 'ets2',
    paused: false,
    speed: 84,          // 84 км/ч (формат udp-bridge.ps1)
    speedLimit: 90,     // 90 км/ч
    cruise: 85,         // CC 85 км/ч
    rpm: 1340,
    rpmLimit: 2500,
    gear: 12,
    displayedGear: 12,
    dgear: 'D12',
    throttle: 0.68,
    brake: 0.0,
    clutch: 0.0,
    steer: -0.08,
    fuel: 759,
    fuelRange: 3299,
    navDist: 245000,    // 245 км
    navTime: 11520,     // ~10 мин реал. времени при scale 19
    scale: 19,
    blinkL: false,
    blinkR: false,
    hazard: false,
    parkLight: true,
    lowBeam: true,
    highBeam: false,
    beacon: false,
    wipers: false,
    parkBrake: false,
    motorBrake: false,
    retarder: 0,
    diffLock: false,
    liftAxle: false,
    trailerLiftAxle: false,
    fuelWarn: false,
    airWarn: false,
    oilWarn: false,
    waterWarn: false,
    batteryWarn: false,
    trailer: { connected: true },
    trip: {
      cargo: lang === 'en' ? 'Electronics' : 'Электроника',
      source: { city: lang === 'en' ? 'Hamburg' : 'Гамбург', company: 'EuroGoodies' },
      destination: { city: lang === 'en' ? 'Prague' : 'Прага', company: 'Transinet' },
      cargoMassKg: 22100,
      plannedDistanceKm: 642,
      income: 24850,
      jobMarket: 'freight_market',
      driven: 397,
      liters: 118,
      avg: 29.7,
      maxSpeed: 89
    },
    cfg: {
      game: 'ets2',
      source: { city: lang === 'en' ? 'Hamburg' : 'Гамбург', company: 'EuroGoodies' },
      destination: { city: lang === 'en' ? 'Prague' : 'Прага', company: 'Transinet' },
      cargo: { name: lang === 'en' ? 'Electronics' : 'Электроника', mass: 22100 },
      planned_distance: { km: 642 },
      income: 24850,
      job: { market: 'freight_market' }
    },
    truckBrand: 'Scania',
    truckName: 'S',
    licensePlate: 'E777TS',
    odometer: 15551,
    fuelAvg: 29.4,
    oilTemp: 90,
    waterTemp: 75,
    air: 9.5,
    adblue: 66,
    battery: 27.4,
    wEngine: 0.01,
    wTrans: 0.01,
    wCabin: 0.01,
    wChassis: 0.01,
    wWheels: 0.01,
    wTrailer: 0.0,
    cargoDmg: 0.0,
    jobDmg: 0.0
  };

  function applyLocalization() {
    const nodes = global.document.querySelectorAll('[data-i18n]');
    nodes.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key);
      }
    });
  }

  function updateClock() {
    const now = new Date();
    const dayNames = t('days');
    const day = dayNames[now.getDay()] || '';
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const nextText = `${day} ${dd} · ${hh}:${mm}`;
    if (nextText !== lastClockText) {
      const clockEl = global.document.getElementById('cam-clock');
      if (clockEl) clockEl.textContent = nextText;
      lastClockText = nextText;
    }
  }

  function applyWebcamState(enabled) {
    const camBox = global.document.getElementById('cam-box');
    if (!camBox) return;
    camBox.classList.toggle('is-hidden', !enabled);
  }

  function pickValidChannelName(channelCfg) {
    if (!channelCfg || !channelCfg.channelName) return '';
    const raw = String(channelCfg.channelName).trim();
    if (!raw || app.isPlaceholder(raw)) return '';
    return raw;
  }

  function updateDriverLabels(driverNameOverride) {
    const cfgDriver = config.ets2 && config.ets2.driverName && !app.isPlaceholder(config.ets2.driverName)
      ? String(config.ets2.driverName).trim()
      : '';
    const twitchName = config.channels ? pickValidChannelName(config.channels.twitch) : '';

    const rawName = driverNameOverride || cfgDriver || twitchName || 'FOOZZEE';
    const cleanName = String(rawName).trim().toUpperCase();

    const driverPill = global.document.getElementById('driver-tag');
    if (driverPill) {
      driverPill.textContent = `${t('driverPrefix')}: ${cleanName}`;
    }

    const camDriverEl = global.document.getElementById('cam-driver-label');
    if (camDriverEl) {
      camDriverEl.textContent = `${t('camPrefix')} // ${cleanName}`;
    }

    const cbText = (config.webcam && config.webcam.cbChannel && !app.isPlaceholder(config.webcam.cbChannel))
      ? String(config.webcam.cbChannel)
      : t('cbDefault');
    const cbEl = global.document.getElementById('cam-cb-badge');
    if (cbEl) {
      cbEl.textContent = cbText;
    }
  }

  function updateDashboardSocials() {
    const twitchItem = global.document.getElementById('dash-twitch-item');
    const twitchText = global.document.getElementById('dash-twitch-text');
    const socialsBox = global.document.getElementById('dash-socials');

    const twitchCfg = config.channels && config.channels.twitch;
    const twitchName = pickValidChannelName(twitchCfg) || 'foozzee';
    const showTwitch = !twitchCfg || twitchCfg.enabled !== false;
    const streamLabel = `twitch.tv/${twitchName.toLowerCase()}`;

    if (twitchText) {
      twitchText.textContent = streamLabel;
    }
    if (twitchItem) twitchItem.classList.toggle('is-hidden', !showTwitch);
    if (socialsBox) {
      socialsBox.classList.toggle('is-hidden', !showTwitch);
    }
  }

  function setRouteDisplay(text, meta, tag) {
    const badgeEl = global.document.getElementById('route-badge');
    const valEl = global.document.getElementById('route-value');
    const metaEl = global.document.getElementById('route-meta');

    if (badgeEl && tag !== undefined) badgeEl.textContent = String(tag);
    if (valEl && text !== undefined) valEl.textContent = String(text);
    if (metaEl && meta !== undefined) metaEl.textContent = String(meta);
    if (text !== undefined) {
      updateTopTickerValues({ route: String(text) });
    }
  }

  function setTrackDisplay(title, artist, isPlaying = true) {
    const trackRow = global.document.getElementById('track-row');
    const titleEl = global.document.getElementById('track-title');
    const artistEl = global.document.getElementById('track-artist');
    const eqEl = global.document.getElementById('eq-bars');

    if (trackRow) {
      trackRow.classList.toggle('is-hidden', config.music && config.music.enabled === false);
    }
    if (titleEl && title !== undefined) titleEl.textContent = String(title);
    if (artistEl) {
      artistEl.textContent = artist ? ` — ${artist}` : '';
    }
    if (eqEl) {
      eqEl.classList.toggle('is-paused', !isPlaying);
    }
  }

  function renderSocials(items) {
    const strip = global.document.getElementById('socials-strip');
    if (!strip) return;

    const validItems = Array.isArray(items)
      ? items.filter((item) => item && item.label && item.value && !app.isPlaceholder(item.value))
      : [];

    if (validItems.length === 0) {
      strip.classList.add('is-hidden');
      strip.replaceChildren();
      return;
    }

    strip.classList.remove('is-hidden');
    strip.replaceChildren();

    validItems.forEach((item, idx) => {
      const slide = global.document.createElement('div');
      slide.className = idx === 0 ? 'social-slide is-active' : 'social-slide';
      slide.innerHTML = `
        <span class="social-badge">${escapeHtml(item.label)}:</span>
        <span class="social-handle">${escapeHtml(item.value)}</span>
      `;
      strip.appendChild(slide);
    });

    socialIndex = 0;
    if (socialsTimer) {
      clearInterval(socialsTimer);
      socialsTimer = null;
    }

    if (validItems.length > 1) {
      const intervalMs = Math.max(3000, Number(config.socials && config.socials.switchIntervalMs) || 9000);
      socialsTimer = setInterval(() => {
        if (global.document.hidden) return;
        const slides = strip.querySelectorAll('.social-slide');
        if (slides.length <= 1) return;

        const prev = slides[socialIndex];
        socialIndex = (socialIndex + 1) % slides.length;
        const next = slides[socialIndex];

        if (leavingTimer) {
          clearTimeout(leavingTimer);
          leavingTimer = null;
        }

        prev.classList.remove('is-active');
        prev.classList.add('is-leaving');
        next.classList.remove('is-leaving');
        next.classList.add('is-active');

        leavingTimer = setTimeout(() => {
          prev.classList.remove('is-leaving');
          leavingTimer = null;
        }, 380);
      }, intervalMs);
    }
  }

  /* ==========================================================================
     УПРАВЛЕНИЕ СОСТОЯНИЕМ ТОРПЕДЫ И БЕГУЩЕЙ СТРОКОЙ
     ========================================================================== */
  function ensureTelemetryPanelVisible() {
    const panel = global.document.getElementById('live-telemetry-panel');
    if (!panel) return null;

    panel.classList.remove('is-hidden', 'is-fading-out');
    if (panel.hidden) {
      panel.hidden = false;
    }
    if (panel.hasAttribute('hidden')) {
      panel.removeAttribute('hidden');
    }
    if (panel.style.display === 'none') {
      panel.style.display = '';
    }
    return panel;
  }

  function updateTickerValues(valuesMap) {
    if (!valuesMap || typeof valuesMap !== 'object') return;

    Object.keys(valuesMap).forEach((key) => {
      const nextText = String(valuesMap[key] ?? '--');
      if (lastTickerValues[key] === nextText) return;
      lastTickerValues[key] = nextText;

      let nodes = tickerNodeCache.get(key);
      if (!nodes) {
        nodes = Array.from(global.document.querySelectorAll(`[data-ticker-key="${key}"]`));
        tickerNodeCache.set(key, nodes);
      }
      nodes.forEach((node) => {
        if (node.textContent !== nextText) {
          node.textContent = nextText;
        }
      });
    });
  }

  function updateTopTickerValues(valuesMap) {
    if (!valuesMap || typeof valuesMap !== 'object') return;

    Object.keys(valuesMap).forEach((key) => {
      const nextText = String(valuesMap[key] ?? '--');
      if (lastTopTickerValues[key] === nextText) return;
      lastTopTickerValues[key] = nextText;

      let nodes = topTickerNodeCache.get(key);
      if (!nodes) {
        nodes = Array.from(global.document.querySelectorAll(`[data-top-key="${key}"]`));
        topTickerNodeCache.set(key, nodes);
      }
      nodes.forEach((node) => {
        if (node.textContent !== nextText) {
          node.textContent = nextText;
        }
      });
    });
  }

  function resolveDisplaySpeedUnit(gameId) {
    if (forcedSpeedDisplayUnit === 'mph' || forcedSpeedDisplayUnit === 'kmh') {
      return forcedSpeedDisplayUnit;
    }
    const apiCfg = (config.ets2 && config.ets2.telemetryApi) || {};
    const pref = String(apiCfg.displayUnit || 'auto').trim().toLowerCase();
    if (pref === 'mph' || pref === 'kmh') return pref;
    if (String(gameId || '').toUpperCase() === 'ATS') return 'mph';
    return 'kmh';
  }

  function updateInstrumentClusterGauges(speedKmh, rpm, displayUnit, rawGear, data) {
    const cluster = global.document.getElementById('live-telemetry-panel');
    const unitMode = displayUnit === 'mph' ? 'mph' : 'kmh';
    if (cluster && cluster.getAttribute('data-speed-unit') !== unitMode) {
      cluster.setAttribute('data-speed-unit', unitMode);
    }

    const speedUnitEl = global.document.getElementById('lt-speed-unit');
    if (speedUnitEl) {
      const unitLabel = unitMode === 'mph' ? t('mph') : t('kmh');
      if (speedUnitEl.textContent !== unitLabel) {
        speedUnitEl.textContent = unitLabel;
      }
    }

    // Стрелка спидометра (-135°..+135° на 0..160 km/h или 0..100 mph)
    const speedNeedle = global.document.getElementById('speed-needle');
    if (speedNeedle) {
      const displayVal = unitMode === 'mph' ? (speedKmh / 1.609344) : speedKmh;
      const maxScale = unitMode === 'mph' ? 100 : 160;
      const clamped = Math.max(0, Math.min(maxScale, Number(displayVal) || 0));
      const angle = -135 + (clamped / maxScale) * 270;
      speedNeedle.style.transform = `rotate(${angle.toFixed(1)}deg)`;
    }

    // Стрелка тахометра (-135°..+135° на 0..3000 RPM)
    const rpmNeedle = global.document.getElementById('rpm-needle');
    if (rpmNeedle) {
      const clampedRpm = Math.max(0, Math.min(3000, Number(rpm) || 0));
      const rpmAngle = -135 + (clampedRpm / 3000) * 270;
      rpmNeedle.style.transform = `rotate(${rpmAngle.toFixed(1)}deg)`;
    }

    // Режим КПП в центре тахометра
    const gearModeEl = global.document.getElementById('lt-gear-mode');
    if (gearModeEl) {
      const gearNum = parseNumericGear(rawGear);
      const gearStr = String(rawGear ?? '').trim().toUpperCase();
      let modeLabel = t('gearModeAuto');
      if (gearNum === 0 || gearStr === 'N') {
        modeLabel = t('gearModeNeutral');
      } else if (gearNum < 0 || gearStr.startsWith('R')) {
        modeLabel = t('gearModeReverse');
      } else if (/^\d+$/.test(gearStr)) {
        modeLabel = t('gearModeManual');
      }
      if (gearModeEl.textContent !== modeLabel) {
        gearModeEl.textContent = modeLabel;
      }
    }

    // Вспомогательные полосы MFD (топливо, воздух, температура ОЖ/масла)
    const fuelFill = global.document.getElementById('mfd-fuel-fill');
    if (fuelFill && data) {
      const fuelObj = data.fuel && typeof data.fuel === 'object' ? data.fuel : null;
      const fuelCur = parseFiniteTelemetryNumber(fuelObj ? (fuelObj.value ?? fuelObj.amount) : data.fuel);
      const fuelCap = parseFiniteTelemetryNumber(
        data.fuelCap ?? data.fuelCapacity ?? (fuelObj && fuelObj.capacity) ?? (data.cfg && (data.cfg.fuelCap ?? data.cfg.fuelCapacity))
      ) || 1000;
      const ratio = fuelCur !== null && fuelCap > 0 ? Math.max(0, Math.min(1, fuelCur / fuelCap)) : 0;
      fuelFill.style.transform = `scaleX(${ratio.toFixed(3)})`;
      fuelFill.classList.toggle('is-low', ratio > 0 && ratio < 0.18 || isTruthyTelemetryFlag(data.fuelWarn));
    }

    const airFill = global.document.getElementById('mfd-air-fill');
    if (airFill && data) {
      const airVal = parseFiniteTelemetryNumber(data.air);
      const airBar = airVal !== null ? (airVal > 20 ? airVal * 0.0689476 : airVal) : 0;
      const airRatio = Math.max(0, Math.min(1, airBar / 12));
      airFill.style.transform = `scaleX(${airRatio.toFixed(3)})`;
      airFill.classList.toggle('is-low', (airBar > 0 && airBar < 6.5) || isTruthyTelemetryFlag(data.airWarn));
    }

    const tempFill = global.document.getElementById('mfd-temp-fill');
    if (tempFill && data) {
      const waterTemp = parseFiniteTelemetryNumber(data.waterTemp);
      const oilTemp = parseFiniteTelemetryNumber(data.oilTemp);
      const tempVal = waterTemp !== null ? waterTemp : (oilTemp !== null ? oilTemp : 0);
      const tempRatio = tempVal > 0 ? Math.max(0, Math.min(1, (tempVal - 30) / 90)) : 0;
      tempFill.style.transform = `scaleX(${tempRatio.toFixed(3)})`;
      tempFill.classList.toggle('is-hot', tempVal >= 102 || isTruthyTelemetryFlag(data.waterWarn) || isTruthyTelemetryFlag(data.oilWarn));
    }
  }

  function resetInstrumentClusterGauges() {
    const speedNeedle = global.document.getElementById('speed-needle');
    if (speedNeedle) speedNeedle.style.transform = 'rotate(-135deg)';
    const rpmNeedle = global.document.getElementById('rpm-needle');
    if (rpmNeedle) rpmNeedle.style.transform = 'rotate(-135deg)';
    const gearModeEl = global.document.getElementById('lt-gear-mode');
    if (gearModeEl) gearModeEl.textContent = '--';

    ['mfd-fuel-fill', 'mfd-air-fill', 'mfd-temp-fill'].forEach((id) => {
      const el = global.document.getElementById(id);
      if (el) {
        el.style.transform = 'scaleX(0)';
        el.classList.remove('is-low', 'is-hot');
      }
    });
  }

  function applyHealthBadgeState(el, prefix, pctValue, emptyTitle, filledTitlePrefix) {
    if (!el) return;
    el.classList.remove('is-ok', 'is-warn', 'is-danger', 'is-detached');
    if (pctValue === null || pctValue === undefined) {
      el.textContent = `${prefix} --`;
      el.classList.add('is-detached');
      if (emptyTitle) el.title = emptyTitle;
      return;
    }
    let statusClass = 'is-ok';
    if (pctValue < 80) {
      statusClass = 'is-danger';
    } else if (pctValue < 95) {
      statusClass = 'is-warn';
    }
    el.textContent = `${prefix} ${pctValue}%`;
    el.classList.add(statusClass);
    if (filledTitlePrefix) {
      el.title = `${filledTitlePrefix}: ${pctValue}%`;
    }
  }

  function applyDashboardInputs(data) {
    const throttleEl = global.document.getElementById('lt-throttle-fill');
    const brakeEl = global.document.getElementById('lt-brake-fill');
    const steerEl = global.document.getElementById('lt-steer-knob');

    const normalizeUnit = (val) => {
      const num = parseFiniteTelemetryNumber(val);
      if (num === null) return 0;
      const scaled = num > 1.01 && num <= 100 ? num / 100 : num;
      return Math.max(0, Math.min(1, scaled));
    };

    if (!data || typeof data !== 'object') {
      if (throttleEl) throttleEl.style.transform = 'scaleX(0)';
      if (brakeEl) brakeEl.style.transform = 'scaleX(0)';
      if (steerEl) steerEl.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    if (throttleEl) {
      const thr = normalizeUnit(data.throttle ?? (data.input && data.input.throttle));
      throttleEl.style.transform = `scaleX(${thr.toFixed(3)})`;
    }
    if (brakeEl) {
      const brk = normalizeUnit(data.brake ?? (data.input && data.input.brake));
      brakeEl.style.transform = `scaleX(${brk.toFixed(3)})`;
    }
    if (steerEl) {
      const rawSteer = parseFiniteTelemetryNumber(data.steer ?? (data.input && data.input.steer));
      const clamped = rawSteer !== null ? Math.max(-1, Math.min(1, rawSteer)) : 0;
      // В SCS SDK положительный steer — поворот влево; смещаем маркер по треку [-56px..+56px]
      const offsetPx = Math.round(-clamped * 56);
      steerEl.style.transform = `translate3d(${offsetPx}px, 0, 0)`;
    }
  }

  function applyGameStatusBadge(data, isStandby, gameId, hasActiveJob) {
    const badgeEl = global.document.getElementById('game-badge');
    const pillEl = global.document.getElementById('game-status-pill');
    const textEl = global.document.getElementById('game-status-text');
    const offlineState = Boolean(
      isStandby || !data || data.connected === false || data.ok === false
    );

    if (badgeEl) {
      if (offlineState) {
        badgeEl.textContent = '--';
        badgeEl.classList.add('is-standby');
      } else {
        badgeEl.textContent = gameId || 'ETS2';
        badgeEl.classList.remove('is-standby');
      }
    }
    if (pillEl) {
      pillEl.classList.remove('is-standby', 'is-paused', 'is-transit', 'is-freeroam');
      if (offlineState) {
        pillEl.classList.add('is-standby');
      } else if (isTruthyTelemetryFlag(data && (data.paused ?? (data.srv && data.srv.paused)))) {
        pillEl.classList.add('is-paused');
      } else if (hasActiveJob) {
        pillEl.classList.add('is-transit');
      } else {
        pillEl.classList.add('is-freeroam');
      }
    }
    if (textEl) {
      if (offlineState) {
        textEl.textContent = t('statusStandby');
      } else if (isTruthyTelemetryFlag(data && (data.paused ?? (data.srv && data.srv.paused)))) {
        textEl.textContent = t('statusPaused');
      } else if (hasActiveJob) {
        textEl.textContent = t('statusInTransit');
      } else {
        textEl.textContent = t('statusFreeRoam');
      }
    }
  }

  function showLiveTelemetry() {
    const panel = ensureTelemetryPanelVisible();
    if (panel) {
      panel.classList.remove('is-offline');
    }
    const topTicker = global.document.getElementById('top-news-ticker');
    if (topTicker) {
      topTicker.classList.remove('is-offline');
    }
    const truckBoard = global.document.getElementById('truck-board');
    if (truckBoard) {
      truckBoard.classList.remove('is-offline');
    }
  }

  function showTelemetryStandby() {
    stickySpeedUnit = null;
    const panel = ensureTelemetryPanelVisible();
    if (panel) {
      panel.classList.add('is-offline');
    }
    const topTicker = global.document.getElementById('top-news-ticker');
    if (topTicker) {
      topTicker.classList.add('is-offline');
    }
    const truckBoard = global.document.getElementById('truck-board');
    if (truckBoard) {
      truckBoard.classList.add('is-offline');
    }
    resetInstrumentClusterGauges();

    const speedEl = global.document.getElementById('lt-speed');
    const speedBlockEl = global.document.getElementById('lt-speed-block');
    const rpmTextEl = global.document.getElementById('lt-rpm-text');
    const rpmFillEl = global.document.getElementById('lt-rpm-fill');
    const limitEl = global.document.getElementById('lt-limit');
    const cruiseEl = global.document.getElementById('lt-cruise');
    const gearEl = global.document.getElementById('lt-gear');
    const fuelEl = global.document.getElementById('lt-fuel');
    const sensorFuelEl = global.document.getElementById('lt-sensor-fuel');
    const navEl = global.document.getElementById('lt-nav');
    const routeProgressEl = global.document.getElementById('lt-route-progress-fill');
    const cargoChipEl = global.document.getElementById('lt-cargo-chip');
    const cargoEl = global.document.getElementById('lt-cargo');

    const truckModelEl = global.document.getElementById('lt-truck-model');
    const truckPlateEl = global.document.getElementById('lt-truck-plate');
    const truckHealthEl = global.document.getElementById('lt-truck-health');
    const trailerHealthEl = global.document.getElementById('lt-trailer-health');
    const cargoHealthEl = global.document.getElementById('lt-cargo-health');
    const truckOdoEl = global.document.getElementById('lt-truck-odometer');
    const fuelAvgEl = global.document.getElementById('lt-sensor-fuel-avg');
    const tempsEl = global.document.getElementById('lt-sensor-temps');
    const airEl = global.document.getElementById('lt-sensor-air');
    const adblueEl = global.document.getElementById('lt-sensor-adblue');
    const batteryEl = global.document.getElementById('lt-sensor-battery');
    const rangeEl = global.document.getElementById('lt-sensor-range');

    if (speedEl) speedEl.textContent = '--';
    if (speedBlockEl) speedBlockEl.classList.remove('is-overspeed');
    if (rpmTextEl) rpmTextEl.textContent = t('rpmStandby');
    if (rpmFillEl) {
      rpmFillEl.style.transform = 'scaleX(0)';
      rpmFillEl.classList.remove('is-redline');
    }
    if (limitEl) {
      limitEl.textContent = '--';
      limitEl.classList.add('is-inactive');
    }
    if (cruiseEl) {
      cruiseEl.textContent = t('cruiseStandby');
      cruiseEl.classList.remove('is-active');
    }
    if (gearEl) gearEl.textContent = '--';
    if (fuelEl) fuelEl.textContent = '--';
    if (sensorFuelEl) sensorFuelEl.textContent = '--';
    if (navEl) navEl.textContent = '--';
    if (routeProgressEl) routeProgressEl.style.transform = 'scaleX(0)';
    if (cargoChipEl) {
      cargoChipEl.classList.remove('is-ok', 'is-warn', 'is-danger');
      cargoChipEl.classList.add('is-detached');
      cargoChipEl.title = t('noTelemetryTitle');
    }
    if (cargoEl) cargoEl.textContent = '--';

    applyDashboardInputs(null);
    applyDashboardIndicators(null);
    applyRealEtaDisplay(null);

    if (config.ets2 && config.ets2.telemetryApi && config.ets2.telemetryApi.enabled) {
      setRouteDisplay('--', '--', (config.ets2 && config.ets2.routeTag) || 'ETS2 // ATS');
    }

    if (truckModelEl) truckModelEl.textContent = t('truckStandby');
    if (truckPlateEl) {
      truckPlateEl.textContent = '';
      truckPlateEl.classList.add('is-empty');
    }
    applyHealthBadgeState(truckHealthEl, t('truckPrefix'), null, t('truckHealthTitle'));
    applyHealthBadgeState(trailerHealthEl, t('trailerPrefix'), null, t('trailerHealthTitle'));
    applyHealthBadgeState(cargoHealthEl, t('cargoPrefix'), null, t('cargoHealthTitle'));

    if (truckOdoEl) truckOdoEl.textContent = `-- ${t('km')}`;
    if (fuelAvgEl) fuelAvgEl.textContent = '--';
    if (tempsEl) tempsEl.textContent = '--';
    if (airEl) airEl.textContent = '--';
    if (adblueEl) adblueEl.textContent = '--';
    if (batteryEl) batteryEl.textContent = '--';
    if (rangeEl) rangeEl.textContent = '--';

    updateTickerValues({
      income: '--',
      companies: '--',
      jobType: '--',
      driven: '--',
      liters: '--',
      avg: '--',
      maxSpeed: '--'
    });
    updateTopTickerValues({
      route: '--',
      navDist: '--',
      cargo: '--'
    });
    applyGameStatusBadge(null, true, '--', false);
  }

  /* ==========================================================================
     ПАРСЕРЫ И КОНВЕРТЕРЫ ДАННЫХ TELEMETRY / R-TRUCKSIM
     ========================================================================== */
  function resolveRawGear(data) {
    if (!data || typeof data !== 'object') return 0;
    if (data.dgear !== undefined && data.dgear !== null && String(data.dgear).trim() !== '') {
      return data.dgear;
    }
    if (data.displayedGear !== undefined && data.displayedGear !== null && String(data.displayedGear).trim() !== '') {
      return data.displayedGear;
    }
    if (data.truck && typeof data.truck === 'object') {
      if (data.truck.displayedGear !== undefined && data.truck.displayedGear !== null && String(data.truck.displayedGear).trim() !== '') {
        return data.truck.displayedGear;
      }
    }
    if (data.gear !== undefined && data.gear !== null && String(data.gear).trim() !== '') {
      return data.gear;
    }
    if (data.truck && typeof data.truck === 'object') {
      if (data.truck.gear !== undefined && data.truck.gear !== null && String(data.truck.gear).trim() !== '') {
        return data.truck.gear;
      }
    }
    return 0;
  }

  function parseNumericGear(rawGear) {
    if (typeof rawGear === 'number' && Number.isFinite(rawGear)) return rawGear;
    const match = String(rawGear ?? '').match(/-?\d+/);
    return match ? Number(match[0]) : 0;
  }

  function formatGearLabel(rawGear) {
    if (typeof rawGear === 'string') {
      const trimmed = rawGear.trim().toUpperCase();
      if (trimmed && !/^-?\d+$/.test(trimmed)) {
        return trimmed;
      }
    }
    const num = Number(rawGear);
    if (!Number.isFinite(num) || num === 0) return 'N';
    if (num < 0) return `R${Math.abs(Math.trunc(num))}`;
    return `D${Math.trunc(num)}`;
  }

  function detectSpeedMultiplier(data, unitPref) {
    if (unitPref === 'ms') return 3.6;
    if (unitPref === 'kmh') return 1;

    if (!data || typeof data !== 'object') return 1;

    // Если пакет содержит только сырое поле speedMs без speed — конвертируем m/s -> km/h
    if (data.speed === undefined && data.speedMs !== undefined) {
      return 3.6;
    }

    // Пакеты от ./scripts/udp-bridge.ps1 (SCS SDK Shared Memory -> HTTP 30002)
    // уже переведены мостом в целые км/ч ($speedKmh = Round(Abs(speedMs) * 3.6))
    const isBridgeKmhPacket = Boolean(
      data.dgear !== undefined ||
      data.displayedGear !== undefined ||
      data.cc !== undefined ||
      data.cruiseControl !== undefined ||
      data.srv !== undefined
    );
    if (isBridgeKmhPacket) {
      stickySpeedUnit = 'kmh';
      return 1;
    }

    if (stickySpeedUnit) {
      return stickySpeedUnit === 'ms' ? 3.6 : 1;
    }

    const limit = Number(data.speedLimit);
    const cruise = Number(data.cruise);
    const speed = Math.abs(Number(data.speed) || 0);

    // Определение сырого m/s только для сторонних неконвертированных дробных источников
    if (Number.isFinite(limit) && limit > 0) {
      if (limit <= 40 && !Number.isInteger(limit)) {
        stickySpeedUnit = 'ms';
        return 3.6;
      }
      if (limit >= 20 && Number.isInteger(limit)) {
        stickySpeedUnit = 'kmh';
        return 1;
      }
    }

    if (Number.isFinite(cruise) && cruise > 0 && cruise <= 35 && !Number.isInteger(cruise)) {
      stickySpeedUnit = 'ms';
      return 3.6;
    }

    if (speed > 45) {
      stickySpeedUnit = 'kmh';
      return 1;
    }

    return 1;
  }

  function parseFuelValue(rawFuel) {
    const val = typeof rawFuel === 'object' && rawFuel !== null
      ? Number(rawFuel.amount ?? rawFuel.current ?? rawFuel.value)
      : Number(rawFuel);
    return Number.isFinite(val) && val >= 0 ? val : null;
  }

  function formatFuelLitersOnly(rawFuel) {
    const fuelVal = parseFuelValue(rawFuel);
    if (fuelVal === null) return '--';
    return `${Math.round(fuelVal)} ${t('l')}`;
  }

  function formatFuelText(rawFuel, rawRange) {
    const fuelVal = parseFuelValue(rawFuel);
    const rangeVal = Number(rawRange);

    const hasFuel = fuelVal !== null;
    const hasRange = Number.isFinite(rangeVal) && rangeVal >= 0;

    if (hasFuel && hasRange) {
      return `${Math.round(fuelVal)} ${t('l')} · ${Math.round(rangeVal)} ${t('km')}`;
    }
    if (hasRange) {
      return `${Math.round(rangeVal)} ${t('km')}`;
    }
    if (hasFuel) {
      return `${Math.round(fuelVal)} ${t('l')}`;
    }
    return '--';
  }

  function resolveNavDistanceMeters(rawDist, apiCfg) {
    const dist = Number(rawDist);
    if (!Number.isFinite(dist) || dist <= 0) return null;
    const distUnit = (apiCfg && apiCfg.navDistUnit) || 'auto';
    const isMeters = distUnit === 'm' || (distUnit === 'auto' && dist > 2500);
    return isMeters ? dist : dist * 1000;
  }

  function formatNavText(rawDist, rawTime, apiCfg) {
    const meters = resolveNavDistanceMeters(rawDist, apiCfg);
    const time = Number(rawTime);
    const hasDist = meters !== null && meters > 0;
    const hasTime = Number.isFinite(time) && time > 0;

    if (!hasDist && !hasTime) return '--';

    let distText = '';
    if (hasDist) {
      if (meters >= 10000) {
        distText = `${formatIntWithSpaces(meters / 1000)} ${t('km')}`;
      } else if (meters >= 1000) {
        distText = `${(meters / 1000).toFixed(1)} ${t('km')}`;
      } else {
        distText = `${Math.round(meters)} ${t('m')}`;
      }
    }

    if (global.document.querySelector('.cockpit-dashboard')) {
      return distText || '--';
    }

    let timeText = '';
    if (hasTime) {
      const timeUnit = (apiCfg && apiCfg.navTimeUnit) || 'auto';
      const isSeconds = timeUnit === 's' || (timeUnit === 'auto' && time > 180);
      const totalMins = Math.max(1, Math.round(isSeconds ? time / 60 : time));
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      timeText = hrs > 0
        ? `${hrs}${t('hShort')} ${String(mins).padStart(2, '0')}${t('mShort')}`
        : `${mins}${t('mShort')}`;
    }

    if (distText && timeText) return `${distText} · ${timeText}`;
    return distText || timeText;
  }

  function isExplicitlyFalseTelemetryFlag(val) {
    if (val === false || val === 0) return true;
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase();
      return normalized === 'false' || normalized === '0' ||
        normalized === 'no' || normalized === 'off';
    }
    return false;
  }

  function isTruthyTelemetryFlag(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return Number.isFinite(val) && val > 0;
    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase();
      if (!normalized || normalized === 'false' || normalized === '0' ||
          normalized === 'no' || normalized === 'off' || normalized === 'null') {
        return false;
      }
      if (normalized === 'true' || normalized === 'yes' || normalized === 'on') {
        return true;
      }
      const num = Number(normalized);
      return Number.isFinite(num) && num > 0;
    }
    return false;
  }

  function isTrailerFlagActive(val) {
    if (val && typeof val === 'object') {
      if (val.connected !== undefined) return isTruthyTelemetryFlag(val.connected);
      if (val.attached !== undefined) return isTruthyTelemetryFlag(val.attached);
      return false;
    }
    return isTruthyTelemetryFlag(val);
  }

  function isTrailerConnected(data) {
    if (!data || typeof data !== 'object') return false;
    return Boolean(
      isTrailerFlagActive(data.trailer) ||
      isTrailerFlagActive(data.trailerOld) ||
      isTrailerFlagActive(data.trailerConnected) ||
      isTrailerFlagActive(data.hasTrailer) ||
      (Array.isArray(data.trailers) && isTrailerFlagActive(data.trailers[0]))
    );
  }

  function isContainerJobInactive(container) {
    if (!container || typeof container !== 'object') return false;
    return (
      isExplicitlyFalseTelemetryFlag(container.active) ||
      isExplicitlyFalseTelemetryFlag(container.onJob) ||
      isExplicitlyFalseTelemetryFlag(container.hasJob) ||
      isExplicitlyFalseTelemetryFlag(container.jobActive)
    );
  }

  function hasExplicitContainerActiveFlag(container) {
    if (!container || typeof container !== 'object') return false;
    return (
      isTruthyTelemetryFlag(container.active) ||
      isTruthyTelemetryFlag(container.onJob) ||
      isTruthyTelemetryFlag(container.hasJob) ||
      isTruthyTelemetryFlag(container.jobActive)
    );
  }

  function pickValidCargoText(candidates) {
    for (let i = 0; i < candidates.length; i += 1) {
      if (typeof candidates[i] !== 'string') continue;
      const clean = candidates[i].trim();
      const lower = clean.toLowerCase();
      if (clean && lower !== 'true' && lower !== 'false' && lower !== '0' &&
          lower !== 'null' && lower !== 'undefined' && lower !== 'none' &&
          lower !== 'n/a' && clean !== '-' && clean !== '--') {
        return clean;
      }
    }
    return '';
  }

  const INVALID_PLACE_NAMES = new Set([
    'city', 'viewpoint', 'viewpoints', 'stop', 'stops', 'bus_stop',
    'station', 'landmark', 'scenic', 'null', 'undefined', 'none', 'n/a', '-', '--'
  ]);

  function cleanStopOrPlaceIdentifier(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let s = raw.trim();

    // 1. Очистка технических префиксов автобусных остановок и станций (DLC Coaches)
    s = s.replace(/^(?:stop|station|terminal)[._\-\s]+/i, '');

    // 2. Очистка технических суффиксов остановок и терминалов
    s = s.replace(/[._\-\s]+(?:bus[._\-\s]*(?:station|stop)|terminal|station)$/i, '');

    // 3. Очистка завершающих цифровых индексов вроде .01, _01, .1
    s = s.replace(/[._\-\s]+\d+$/i, '');

    // 4. Очистка начальных цифровых индексов вроде 01. или 1_
    s = s.replace(/^\d+[._\-\s]+/i, '');

    // 5. Замена подчёркиваний на пробелы и нормализация пробелов
    s = s.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();

    if (INVALID_PLACE_NAMES.has(s.toLowerCase())) return '';
    return s;
  }

  function isValidPlaceName(str) {
    if (typeof str !== 'string') return false;
    const clean = str.trim();
    if (!clean) return false;
    const cleanedStop = cleanStopOrPlaceIdentifier(clean);
    if (!cleanedStop) return false;
    return !INVALID_PLACE_NAMES.has(clean.toLowerCase()) && !INVALID_PLACE_NAMES.has(cleanedStop.toLowerCase());
  }

  function pickValidPlaceText(candidates) {
    for (let i = 0; i < candidates.length; i += 1) {
      if (typeof candidates[i] !== 'string') continue;
      const clean = candidates[i].trim();
      if (isValidPlaceName(clean)) {
        return clean;
      }
    }
    return '';
  }

  /* ==========================================================================
     СЛОВАРЬ ГОРОДОВ И ОСТАНОВОК ETS2 / ATS (RU / EN)
     ========================================================================== */
  const CITIES_DB = {
    // Германия (ETS2)
    berlin: { ru: 'Берлин', en: 'Berlin' },
    hamburg: { ru: 'Гамбург', en: 'Hamburg' },
    munchen: { ru: 'Мюнхен', en: 'Munich' },
    munich: { ru: 'Мюнхен', en: 'Munich' },
    frankfurt: { ru: 'Франкфурт-на-Майне', en: 'Frankfurt am Main' },
    frankfurtammain: { ru: 'Франкфурт-на-Майне', en: 'Frankfurt am Main' },
    koln: { ru: 'Кёльн', en: 'Cologne' },
    cologne: { ru: 'Кёльн', en: 'Cologne' },
    stuttgart: { ru: 'Штутгарт', en: 'Stuttgart' },
    leipzig: { ru: 'Лейпциг', en: 'Leipzig' },
    dresden: { ru: 'Дрезден', en: 'Dresden' },
    nurnberg: { ru: 'Нюрнберг', en: 'Nuremberg' },
    nuremberg: { ru: 'Нюрнберг', en: 'Nuremberg' },
    bremen: { ru: 'Бремен', en: 'Bremen' },
    dortmund: { ru: 'Дортмунд', en: 'Dortmund' },
    dusseldorf: { ru: 'Дюссельдорф', en: 'Düsseldorf' },
    hannover: { ru: 'Ганновер', en: 'Hannover' },
    rostock: { ru: 'Росток', en: 'Rostock' },
    kiel: { ru: 'Киль', en: 'Kiel' },
    magdeburg: { ru: 'Магдебург', en: 'Magdeburg' },
    erfurt: { ru: 'Эрфурт', en: 'Erfurt' },
    kassel: { ru: 'Кассель', en: 'Kassel' },
    mannheim: { ru: 'Мангейм', en: 'Mannheim' },
    duisburg: { ru: 'Дуйсбург', en: 'Duisburg' },
    osnabruck: { ru: 'Оснабрюк', en: 'Osnabrück' },

    // Франция (ETS2)
    paris: { ru: 'Париж', en: 'Paris' },
    lyon: { ru: 'Лион', en: 'Lyon' },
    marseille: { ru: 'Марсель', en: 'Marseille' },
    toulouse: { ru: 'Тулуза', en: 'Toulouse' },
    nice: { ru: 'Ницца', en: 'Nice' },
    nantes: { ru: 'Нант', en: 'Nantes' },
    strasbourg: { ru: 'Страсбург', en: 'Strasbourg' },
    montpellier: { ru: 'Монпелье', en: 'Montpellier' },
    bordeaux: { ru: 'Бордо', en: 'Bordeaux' },
    lille: { ru: 'Лилль', en: 'Lille' },
    rennes: { ru: 'Ренн', en: 'Rennes' },
    reims: { ru: 'Реймс', en: 'Reims' },
    lehavre: { ru: 'Гавр', en: 'Le Havre' },
    brest: { ru: 'Брест', en: 'Brest' },
    calais: { ru: 'Кале', en: 'Calais' },
    dijon: { ru: 'Дижон', en: 'Dijon' },
    metz: { ru: 'Мец', en: 'Metz' },
    limoges: { ru: 'Лимож', en: 'Limoges' },
    clermontferrand: { ru: 'Клермон-Ферран', en: 'Clermont-Ferrand' },
    lemans: { ru: 'Ле-Ман', en: 'Le Mans' },
    larochelle: { ru: 'Ла-Рошель', en: 'La Rochelle' },
    bourges: { ru: 'Бурж', en: 'Bourges' },

    // Великобритания (ETS2)
    london: { ru: 'Лондон', en: 'London' },
    birmingham: { ru: 'Бирмингем', en: 'Birmingham' },
    manchester: { ru: 'Манчестер', en: 'Manchester' },
    glasgow: { ru: 'Глазго', en: 'Glasgow' },
    edinburgh: { ru: 'Эдинбург', en: 'Edinburgh' },
    liverpool: { ru: 'Ливерпуль', en: 'Liverpool' },
    bristol: { ru: 'Бристоль', en: 'Bristol' },
    sheffield: { ru: 'Шеффилд', en: 'Sheffield' },
    leeds: { ru: 'Лидс', en: 'Leeds' },
    newcastle: { ru: 'Ньюкасл', en: 'Newcastle' },
    aberdeen: { ru: 'Абердин', en: 'Aberdeen' },
    cardiff: { ru: 'Кардифф', en: 'Cardiff' },
    swansea: { ru: 'Суонси', en: 'Swansea' },
    plymouth: { ru: 'Плимут', en: 'Plymouth' },
    southampton: { ru: 'Саутгемптон', en: 'Southampton' },
    dover: { ru: 'Дувр', en: 'Dover' },
    felixstowe: { ru: 'Феликстоу', en: 'Felixstowe' },
    cambridge: { ru: 'Кембридж', en: 'Cambridge' },
    carlisle: { ru: 'Карлайл', en: 'Carlisle' },
    grimsby: { ru: 'Гримсби', en: 'Grimsby' },

    // Италия (ETS2)
    roma: { ru: 'Рим', en: 'Rome' },
    rome: { ru: 'Рим', en: 'Rome' },
    milano: { ru: 'Милан', en: 'Milan' },
    milan: { ru: 'Милан', en: 'Milan' },
    napoli: { ru: 'Неаполь', en: 'Naples' },
    naples: { ru: 'Неаполь', en: 'Naples' },
    torino: { ru: 'Турин', en: 'Turin' },
    turin: { ru: 'Турин', en: 'Turin' },
    firenze: { ru: 'Флоренция', en: 'Florence' },
    florence: { ru: 'Флоренция', en: 'Florence' },
    venezia: { ru: 'Венеция', en: 'Venice' },
    venice: { ru: 'Венеция', en: 'Venice' },
    bologna: { ru: 'Болонья', en: 'Bologna' },
    genova: { ru: 'Генуя', en: 'Genoa' },
    genoa: { ru: 'Генуя', en: 'Genoa' },
    verona: { ru: 'Верона', en: 'Verona' },
    palermo: { ru: 'Палермо', en: 'Palermo' },
    catania: { ru: 'Катания', en: 'Catania' },
    messina: { ru: 'Мессина', en: 'Messina' },
    bari: { ru: 'Бари', en: 'Bari' },
    taranto: { ru: 'Таранто', en: 'Taranto' },
    ancona: { ru: 'Анкона', en: 'Ancona' },
    trieste: { ru: 'Триест', en: 'Trieste' },
    parma: { ru: 'Парма', en: 'Parma' },
    livorno: { ru: 'Ливорно', en: 'Livorno' },
    cagliari: { ru: 'Кальяри', en: 'Cagliari' },
    sassari: { ru: 'Сассари', en: 'Sassari' },
    pescara: { ru: 'Пескара', en: 'Pescara' },

    // Чехия и Словакия (ETS2)
    praha: { ru: 'Прага', en: 'Prague' },
    prague: { ru: 'Прага', en: 'Prague' },
    brno: { ru: 'Брно', en: 'Brno' },
    ostrava: { ru: 'Острава', en: 'Ostrava' },
    plzen: { ru: 'Пльзень', en: 'Plzeň' },
    bratislava: { ru: 'Братислава', en: 'Bratislava' },
    kosice: { ru: 'Кошице', en: 'Košice' },
    banskabystrica: { ru: 'Банска-Бистрица', en: 'Banská Bystrica' },

    // Польша (ETS2)
    warszawa: { ru: 'Варшава', en: 'Warsaw' },
    warsaw: { ru: 'Варшава', en: 'Warsaw' },
    krakow: { ru: 'Краков', en: 'Kraków' },
    lodz: { ru: 'Лодзь', en: 'Łódź' },
    wroclaw: { ru: 'Вроцлав', en: 'Wrocław' },
    poznan: { ru: 'Познань', en: 'Poznań' },
    gdansk: { ru: 'Гданьск', en: 'Gdańsk' },
    szczecin: { ru: 'Щецин', en: 'Szczecin' },
    bydgoszcz: { ru: 'Быдгощ', en: 'Bydgoszcz' },
    lublin: { ru: 'Люблин', en: 'Lublin' },
    katowice: { ru: 'Катовице', en: 'Katowice' },
    bialystok: { ru: 'Белосток', en: 'Białystok' },
    olsztyn: { ru: 'Ольштын', en: 'Olsztyn' },

    // Австрия и Швейцария (ETS2)
    wien: { ru: 'Вена', en: 'Vienna' },
    vienna: { ru: 'Вена', en: 'Vienna' },
    graz: { ru: 'Грац', en: 'Graz' },
    linz: { ru: 'Линц', en: 'Linz' },
    salzburg: { ru: 'Зальцбург', en: 'Salzburg' },
    innsbruck: { ru: 'Инсбрук', en: 'Innsbruck' },
    klagenfurt: { ru: 'Клагенфурт', en: 'Klagenfurt' },
    bern: { ru: 'Берн', en: 'Bern' },
    zurich: { ru: 'Цюрих', en: 'Zurich' },
    geneve: { ru: 'Женева', en: 'Geneva' },
    geneva: { ru: 'Женева', en: 'Geneva' },
    basel: { ru: 'Базель', en: 'Basel' },

    // Скандинавия и Исландия (DLC Coaches & Nordic Horizons)
    stockholm: { ru: 'Стокгольм', en: 'Stockholm' },
    goteborg: { ru: 'Гётеборг', en: 'Gothenburg' },
    gothenburg: { ru: 'Гётеборг', en: 'Gothenburg' },
    malmo: { ru: 'Мальмё', en: 'Malmö' },
    uppsala: { ru: 'Уппсала', en: 'Uppsala' },
    jonkoping: { ru: 'Йёнчёпинг', en: 'Jönköping' },
    linkoping: { ru: 'Линчёпинг', en: 'Linköping' },
    orebro: { ru: 'Эребру', en: 'Örebro' },
    vasteras: { ru: 'Вестерос', en: 'Västerås' },
    oslo: { ru: 'Осло', en: 'Oslo' },
    bergen: { ru: 'Берген', en: 'Bergen' },
    stavanger: { ru: 'Ставангер', en: 'Stavanger' },
    kristiansand: { ru: 'Кристиансанн', en: 'Kristiansand' },
    kobenhavn: { ru: 'Копенгаген', en: 'Copenhagen' },
    copenhagen: { ru: 'Копенгаген', en: 'Copenhagen' },
    aarhus: { ru: 'Орхус', en: 'Aarhus' },
    odense: { ru: 'Оденсе', en: 'Odense' },
    aalborg: { ru: 'Ольборг', en: 'Aalborg' },
    helsinki: { ru: 'Хельсинки', en: 'Helsinki' },
    turku: { ru: 'Турку', en: 'Turku' },
    tampere: { ru: 'Тампере', en: 'Tampere' },
    lahti: { ru: 'Лахти', en: 'Lahti' },
    oulu: { ru: 'Оулу', en: 'Oulu' },
    vaasa: { ru: 'Вааса', en: 'Vaasa' },
    rovaniemi: { ru: 'Рованиеми', en: 'Rovaniemi' },
    reykjavik: { ru: 'Рейкьявик', en: 'Reykjavík' },
    akureyri: { ru: 'Акюрейри', en: 'Akureyri' },
    jokulsarlon: { ru: 'Йёкюльсаурлоун', en: 'Jökulsárlón' },
    seydisfjordur: { ru: 'Сейдисфьордюр', en: 'Seyðisfjörður' },
    vik: { ru: 'Вик', en: 'Vík' },
    keflavik: { ru: 'Кеблавик', en: 'Keflavík' },
    egilsstadir: { ru: 'Эгильсстадир', en: 'Egilsstaðir' },
    isafjordur: { ru: 'Исафьордюр', en: 'Ísafjörður' },

    // Страны Балтии (ETS2)
    tallinn: { ru: 'Таллин', en: 'Tallinn' },
    tartu: { ru: 'Тарту', en: 'Tartu' },
    parnu: { ru: 'Пярну', en: 'Pärnu' },
    narva: { ru: 'Нарва', en: 'Narva' },
    riga: { ru: 'Рига', en: 'Riga' },
    daugavpils: { ru: 'Даугавпилс', en: 'Daugavpils' },
    liepaja: { ru: 'Лиепая', en: 'Liepāja' },
    ventspils: { ru: 'Вентспилс', en: 'Ventspils' },
    valmiera: { ru: 'Валмиера', en: 'Valmiera' },
    vilnius: { ru: 'Вильнюс', en: 'Vilnius' },
    kaunas: { ru: 'Каунас', en: 'Kaunas' },
    klaipeda: { ru: 'Клайпеда', en: 'Klaipėda' },
    panevezys: { ru: 'Паневежис', en: 'Panevėžys' },
    siauliai: { ru: 'Шяуляй', en: 'Šiauliai' },
    utena: { ru: 'Утена', en: 'Utena' },

    // Балканы, Румыния, Болгария, Турция (ETS2)
    beograd: { ru: 'Белград', en: 'Belgrade' },
    belgrade: { ru: 'Белград', en: 'Belgrade' },
    zagreb: { ru: 'Загреб', en: 'Zagreb' },
    sarajevo: { ru: 'Сараево', en: 'Sarajevo' },
    ljubljana: { ru: 'Любляна', en: 'Ljubljana' },
    skopje: { ru: 'Скопье', en: 'Skopje' },
    podgorica: { ru: 'Подгорица', en: 'Podgorica' },
    pristina: { ru: 'Приштина', en: 'Pristina' },
    tirana: { ru: 'Тирана', en: 'Tirana' },
    sofia: { ru: 'София', en: 'Sofia' },
    plovdiv: { ru: 'Пловдив', en: 'Plovdiv' },
    varna: { ru: 'Варна', en: 'Varna' },
    burgas: { ru: 'Бургас', en: 'Burgas' },
    ruse: { ru: 'Русе', en: 'Ruse' },
    bucuresti: { ru: 'Бухарест', en: 'Bucharest' },
    bucharest: { ru: 'Бухарест', en: 'Bucharest' },
    clujnapoca: { ru: 'Клуж-Напока', en: 'Cluj-Napoca' },
    timisoara: { ru: 'Тимишоара', en: 'Timișoara' },
    iasi: { ru: 'Яссы', en: 'Iași' },
    constanta: { ru: 'Констанца', en: 'Constanța' },
    brasov: { ru: 'Брашов', en: 'Brașov' },
    craiova: { ru: 'Крайова', en: 'Craiova' },
    galati: { ru: 'Галац', en: 'Galați' },
    istanbul: { ru: 'Стамбул', en: 'Istanbul' },
    edirne: { ru: 'Эдирне', en: 'Edirne' },
    tekirdag: { ru: 'Текирдаг', en: 'Tekirdağ' },

    // Греция (ETS2)
    athens: { ru: 'Афины', en: 'Athens' },
    athina: { ru: 'Афины', en: 'Athens' },
    thessaloniki: { ru: 'Салоники', en: 'Thessaloniki' },
    patras: { ru: 'Патры', en: 'Patras' },
    patra: { ru: 'Патры', en: 'Patras' },
    heraklion: { ru: 'Ираклион', en: 'Heraklion' },
    irakleio: { ru: 'Ираклион', en: 'Heraklion' },
    larissa: { ru: 'Лариса', en: 'Larissa' },
    volos: { ru: 'Волос', en: 'Volos' },
    rhodes: { ru: 'Родос', en: 'Rhodes' },
    rodos: { ru: 'Родос', en: 'Rhodes' },
    chania: { ru: 'Ханья', en: 'Chania' },
    ioannina: { ru: 'Янина', en: 'Ioannina' },
    kavala: { ru: 'Кавала', en: 'Kavala' },

    // Пиренейский полуостров (Iberia)
    madrid: { ru: 'Мадрид', en: 'Madrid' },
    barcelona: { ru: 'Барселона', en: 'Barcelona' },
    valencia: { ru: 'Валенсия', en: 'Valencia' },
    sevilla: { ru: 'Севилья', en: 'Seville' },
    seville: { ru: 'Севилья', en: 'Seville' },
    zaragoza: { ru: 'Сарагоса', en: 'Zaragoza' },
    malaga: { ru: 'Малага', en: 'Málaga' },
    murcia: { ru: 'Мурсия', en: 'Murcia' },
    bilbao: { ru: 'Бильбао', en: 'Bilbao' },
    alicante: { ru: 'Аликанте', en: 'Alicante' },
    cordoba: { ru: 'Кордова', en: 'Córdoba' },
    valladolid: { ru: 'Вальядолид', en: 'Valladolid' },
    vigo: { ru: 'Виго', en: 'Vigo' },
    gijon: { ru: 'Хихон', en: 'Gijón' },
    granada: { ru: 'Гранада', en: 'Granada' },
    acoruna: { ru: 'Ла-Корунья', en: 'A Coruña' },
    santander: { ru: 'Сантандер', en: 'Santander' },
    burgos: { ru: 'Бургос', en: 'Burgos' },
    salamanca: { ru: 'Саламанка', en: 'Salamanca' },
    albacete: { ru: 'Альбасете', en: 'Albacete' },
    almeria: { ru: 'Альмерия', en: 'Almería' },
    badajoz: { ru: 'Бадахос', en: 'Badajoz' },
    huelva: { ru: 'Уэльва', en: 'Huelva' },
    lisboa: { ru: 'Лиссабон', en: 'Lisbon' },
    lisbon: { ru: 'Лиссабон', en: 'Lisbon' },
    porto: { ru: 'Порту', en: 'Porto' },
    coimbra: { ru: 'Коимбра', en: 'Coimbra' },
    faro: { ru: 'Фару', en: 'Faro' },
    braga: { ru: 'Брага', en: 'Braga' },
    evora: { ru: 'Эвора', en: 'Évora' },

    // Россия (Балтика / RusMap)
    saintpetersburg: { ru: 'Санкт-Петербург', en: 'Saint Petersburg' },
    spb: { ru: 'Санкт-Петербург', en: 'Saint Petersburg' },
    moscow: { ru: 'Москва', en: 'Moscow' },
    pskov: { ru: 'Псков', en: 'Pskov' },
    luga: { ru: 'Луга', en: 'Luga' },
    sosnovybor: { ru: 'Сосновый Бор', en: 'Sosnovy Bor' },
    vyborg: { ru: 'Выборг', en: 'Vyborg' },
    velikiynovgorod: { ru: 'Великий Новгород', en: 'Veliky Novgorod' },
    tver: { ru: 'Тверь', en: 'Tver' },
    smolensk: { ru: 'Смоленск', en: 'Smolensk' },
    kaluga: { ru: 'Калуга', en: 'Kaluga' },
    bryansk: { ru: 'Брянск', en: 'Bryansk' },
    oryol: { ru: 'Орёл', en: 'Oryol' },
    kursk: { ru: 'Курск', en: 'Kursk' },
    voronezh: { ru: 'Воронеж', en: 'Voronezh' },
    rostovondon: { ru: 'Ростов-на-Дону', en: 'Rostov-on-Don' },

    // США (American Truck Simulator)
    losangeles: { ru: 'Лос-Анджелес', en: 'Los Angeles' },
    sanfrancisco: { ru: 'Сан-Франциско', en: 'San Francisco' },
    sandiego: { ru: 'Сан-Диего', en: 'San Diego' },
    sacramento: { ru: 'Сакраменто', en: 'Sacramento' },
    fresno: { ru: 'Фресно', en: 'Fresno' },
    bakersfield: { ru: 'Бейкерсфилд', en: 'Bakersfield' },
    oakland: { ru: 'Окленд', en: 'Oakland' },
    sanjose: { ru: 'Сан-Хосе', en: 'San Jose' },
    lasvegas: { ru: 'Лас-Вегас', en: 'Las Vegas' },
    reno: { ru: 'Рино', en: 'Reno' },
    carsoncity: { ru: 'Карсон-Сити', en: 'Carson City' },
    elko: { ru: 'Элко', en: 'Elko' },
    phoenix: { ru: 'Финикс', en: 'Phoenix' },
    tucson: { ru: 'Тусон', en: 'Tucson' },
    flagstaff: { ru: 'Флагстафф', en: 'Flagstaff' },
    yuma: { ru: 'Юма', en: 'Yuma' },
    albuquerque: { ru: 'Альбукерке', en: 'Albuquerque' },
    santafe: { ru: 'Санта-Фе', en: 'Santa Fe' },
    lascruces: { ru: 'Лас-Крусес', en: 'Las Cruces' },
    roswell: { ru: 'Розуэлл', en: 'Roswell' },
    portland: { ru: 'Портленд', en: 'Portland' },
    salem: { ru: 'Сейлем', en: 'Salem' },
    eugene: { ru: 'Юджин', en: 'Eugene' },
    bend: { ru: 'Бенд', en: 'Bend' },
    medford: { ru: 'Медфорд', en: 'Medford' },
    seattle: { ru: 'Сиэтл', en: 'Seattle' },
    spokane: { ru: 'Спокан', en: 'Spokane' },
    tacoma: { ru: 'Такома', en: 'Tacoma' },
    olympia: { ru: 'Олимпия', en: 'Olympia' },
    yakima: { ru: 'Якима', en: 'Yakima' },
    bellingham: { ru: 'Беллингхем', en: 'Bellingham' },
    saltlakecity: { ru: 'Солт-Лейк-Сити', en: 'Salt Lake City' },
    provo: { ru: 'Прово', en: 'Provo' },
    ogden: { ru: 'Огден', en: 'Ogden' },
    stgeorge: { ru: 'Сент-Джордж', en: 'St. George' },
    boise: { ru: 'Бойсе', en: 'Boise' },
    idahofalls: { ru: 'Айдахо-Фолс', en: 'Idaho Falls' },
    pocatello: { ru: 'Покателло', en: 'Pocatello' },
    twinfalls: { ru: 'Твин-Фолс', en: 'Twin Falls' },
    denver: { ru: 'Денвер', en: 'Denver' },
    coloradosprings: { ru: 'Колорадо-Спрингс', en: 'Colorado Springs' },
    pueblo: { ru: 'Пуэбло', en: 'Pueblo' },
    fortcollins: { ru: 'Форт-Коллинз', en: 'Fort Collins' },
    grandjunction: { ru: 'Гранд-Джанкшен', en: 'Grand Junction' },
    cheyenne: { ru: 'Шайенн', en: 'Cheyenne' },
    casper: { ru: 'Каспер', en: 'Casper' },
    laramie: { ru: 'Ларами', en: 'Laramie' },
    billings: { ru: 'Биллингс', en: 'Billings' },
    missoula: { ru: 'Мизула', en: 'Missoula' },
    helena: { ru: 'Хелена', en: 'Helena' },
    bozeman: { ru: 'Бозмен', en: 'Bozeman' },
    greatfalls: { ru: 'Грейт-Фолс', en: 'Great Falls' },
    houston: { ru: 'Хьюстон', en: 'Houston' },
    dallas: { ru: 'Даллас', en: 'Dallas' },
    austin: { ru: 'Остин', en: 'Austin' },
    sanantonio: { ru: 'Сан-Антонио', en: 'San Antonio' },
    elpaso: { ru: 'Эль-Пасо', en: 'El Paso' },
    fortworth: { ru: 'Форт-Уэрт', en: 'Fort Worth' },
    lubbock: { ru: 'Лаббок', en: 'Lubbock' },
    amarillo: { ru: 'Амарилло', en: 'Amarillo' },
    corpuschristi: { ru: 'Корпус-Кристи', en: 'Corpus Christi' },
    laredo: { ru: 'Ларедо', en: 'Laredo' },
    oklahomacity: { ru: 'Оклахома-Сити', en: 'Oklahoma City' },
    tulsa: { ru: 'Талса', en: 'Tulsa' },
    lawton: { ru: 'Лотон', en: 'Lawton' },
    wichita: { ru: 'Уичито', en: 'Wichita' },
    topeka: { ru: 'Топика', en: 'Topeka' },
    kansascity: { ru: 'Канзас-Сити', en: 'Kansas City' },
    omaha: { ru: 'Омаха', en: 'Omaha' },
    lincoln: { ru: 'Линкольн', en: 'Lincoln' },
    littlerock: { ru: 'Литл-Рок', en: 'Little Rock' }
  };

  const RUSSIAN_TO_ENGLISH_CITIES_DB = Object.create(null);
  Object.keys(CITIES_DB).forEach((key) => {
    const entry = CITIES_DB[key];
    if (entry && entry.ru && entry.en) {
      RUSSIAN_TO_ENGLISH_CITIES_DB[entry.ru.toLowerCase()] = entry.en;
    }
  });

  /* ==========================================================================
     ФОНЕТИЧЕСКАЯ ТРАНСЛИТЕРАЦИЯ (LATIN <-> CYRILLIC) ДЛЯ РЕДКИХ ГОРОДОВ И МОДОВ
     ========================================================================== */
  function transliterateLatinToCyrillic(str) {
    if (!str || typeof str !== 'string') return '';
    let text = str;

    const multiMap = [
      [/tsch/gi, 'ч'],
      [/tion/gi, 'шн'],
      [/sion/gi, 'жн'],
      [/sch/gi, 'ш'],
      [/shh/gi, 'щ'],
      [/sh/gi, 'ш'],
      [/ch/gi, 'ч'],
      [/zh/gi, 'ж'],
      [/th/gi, 'т'],
      [/kh/gi, 'х'],
      [/ph/gi, 'ф'],
      [/ck/gi, 'к'],
      [/ts/gi, 'ц'],
      [/tz/gi, 'ц'],
      [/qu/gi, 'кв'],
      [/ee/gi, 'и'],
      [/oo/gi, 'у'],
      [/ya/gi, 'я'],
      [/yu/gi, 'ю'],
      [/yo/gi, 'ё'],
      [/ye/gi, 'е'],
      [/ei/gi, 'эй'],
      [/ai/gi, 'ай'],
      [/ay/gi, 'ай'],
      [/ey/gi, 'ей'],
      [/oy/gi, 'ой'],
      [/ij/gi, 'ей']
    ];

    multiMap.forEach(([regex, repl]) => {
      text = text.replace(regex, (match) => {
        if (match === match.toUpperCase()) return repl.toUpperCase();
        if (match[0] === match[0].toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
        return repl;
      });
    });

    const diacriticsMap = {
      'ä': 'э', 'Ä': 'Э', 'ö': 'ё', 'Ö': 'Ё', 'ü': 'ю', 'Ü': 'Ю',
      'å': 'о', 'Å': 'О', 'æ': 'э', 'Æ': 'Э', 'ø': 'ё', 'Ø': 'Ё',
      'é': 'е', 'É': 'Е', 'è': 'е', 'È': 'Е', 'ê': 'е', 'Ê': 'Е', 'ë': 'ё', 'Ë': 'Ё',
      'á': 'а', 'Á': 'А', 'à': 'а', 'À': 'А', 'í': 'и', 'Í': 'И', 'ó': 'о', 'Ó': 'О',
      'ú': 'у', 'Ú': 'У', 'ý': 'и', 'Ý': 'И', 'č': 'ч', 'Č': 'Ч', 'š': 'ш', 'Š': 'Ш',
      'ž': 'ж', 'Ž': 'Ж', 'ř': 'рж', 'Ř': 'Рж', 'ď': 'дь', 'Ď': 'Дь', 'ť': 'ть', 'Ť': 'Ть',
      'ň': 'нь', 'Ň': 'Нь', 'ł': 'л', 'Ł': 'Л', 'ń': 'нь', 'Ń': 'Нь', 'ś': 'сь', 'Ś': 'Сь',
      'ź': 'зь', 'Ź': 'Зь', 'ż': 'ж', 'Ż': 'Ж', 'ş': 'ш', 'Ş': 'Ш', 'ğ': 'г', 'Ğ': 'Г',
      'ç': 'ч', 'Ç': 'Ч', 'ð': 'д', 'Ð': 'Д', 'þ': 'т', 'Þ': 'Т'
    };

    text = text.replace(/[^\u0000-\u007F]/g, (char) => diacriticsMap[char] || char);

    const singleMap = {
      'a': 'а', 'b': 'б', 'c': 'к', 'd': 'д', 'e': 'е', 'f': 'ф', 'g': 'г',
      'h': 'х', 'i': 'и', 'j': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н',
      'o': 'о', 'p': 'п', 'q': 'к', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у',
      'v': 'в', 'w': 'в', 'x': 'кс', 'y': 'и', 'z': 'з',
      'A': 'А', 'B': 'Б', 'C': 'К', 'D': 'Д', 'E': 'Е', 'F': 'Ф', 'G': 'Г',
      'H': 'Х', 'I': 'И', 'J': 'Й', 'K': 'К', 'L': 'Л', 'M': 'М', 'N': 'Н',
      'O': 'О', 'P': 'П', 'Q': 'К', 'R': 'Р', 'S': 'С', 'T': 'Т', 'U': 'У',
      'V': 'В', 'W': 'В', 'X': 'Кс', 'Y': 'И', 'Z': 'З'
    };

    return text.replace(/[a-zA-Z]/g, (ch) => singleMap[ch] || ch);
  }

  function transliterateCyrillicToLatin(str) {
    if (!str || typeof str !== 'string') return '';
    let text = str;

    const multiMap = [
      [/щ/gi, 'shch'],
      [/ш/gi, 'sh'],
      [/ч/gi, 'ch'],
      [/ж/gi, 'zh'],
      [/х/gi, 'kh'],
      [/ц/gi, 'ts'],
      [/ю/gi, 'yu'],
      [/я/gi, 'ya'],
      [/ё/gi, 'yo']
    ];

    multiMap.forEach(([regex, repl]) => {
      text = text.replace(regex, (match) => {
        if (match === match.toUpperCase()) return repl.toUpperCase();
        if (match[0] === match[0].toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
        return repl;
      });
    });

    const singleMap = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'з': 'z',
      'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'ъ': '',
      'ы': 'y', 'ь': '', 'э': 'e',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'З': 'Z',
      'И': 'I', 'Й': 'Y', 'К': 'K', 'L': 'L', 'М': 'M', 'N': 'N', 'О': 'O',
      'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Ъ': '',
      'Ы': 'Y', 'Ь': '', 'Э': 'E'
    };

    return text.replace(/[а-яА-ЯёЁ]/g, (ch) => singleMap[ch] !== undefined ? singleMap[ch] : ch);
  }

  function formatToTitleCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\b[\wа-яА-ЯёЁ]+/g, (word) => {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  }

  function normalizeCityKey(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function localizePlaceName(rawDisplay, rawId, targetLang) {
    const rawClean = cleanStopOrPlaceIdentifier(rawDisplay);
    const idClean = cleanStopOrPlaceIdentifier(rawId);

    if (!rawClean && !idClean) return '';

    const effectiveTargetLang = (targetLang === 'en' || targetLang === 'ru') ? targetLang : 'ru';

    const keyCandidates = [
      normalizeCityKey(idClean),
      normalizeCityKey(rawClean),
      normalizeCityKey(rawId),
      normalizeCityKey(rawDisplay)
    ].filter(Boolean);

    let dictMatch = null;
    for (let i = 0; i < keyCandidates.length; i += 1) {
      const k = keyCandidates[i];
      if (CITIES_DB[k]) {
        dictMatch = CITIES_DB[k];
        break;
      }
    }

    const hasCyrillicInDisplay = /[а-яё]/i.test(rawClean);

    if (effectiveTargetLang === 'ru') {
      if (hasCyrillicInDisplay) {
        return rawClean;
      }
      if (dictMatch && dictMatch.ru) {
        return dictMatch.ru;
      }
      const baseStr = rawClean || idClean;
      return transliterateLatinToCyrillic(formatToTitleCase(baseStr));
    } else {
      if (dictMatch && dictMatch.en) {
        return dictMatch.en;
      }
      if (hasCyrillicInDisplay) {
        const ruLower = rawClean.toLowerCase();
        if (RUSSIAN_TO_ENGLISH_CITIES_DB[ruLower]) {
          return RUSSIAN_TO_ENGLISH_CITIES_DB[ruLower];
        }
        return formatToTitleCase(transliterateCyrillicToLatin(rawClean));
      }
      const baseStr = idClean || rawClean;
      return formatToTitleCase(baseStr);
    }
  }

  function cleanAndFormatStopOrCompany(rawText, targetLang) {
    if (!rawText || typeof rawText !== 'string') return '';
    const clean = rawText.trim();
    if (!isValidPlaceName(clean)) return '';

    const isStopToken = /^(?:stop|station|terminal)[._\-\s]+/i.test(clean) ||
                        /[._\-\s]+(?:bus[._\-\s]*(?:station|stop)|terminal|station)$/i.test(clean) ||
                        /^[a-z0-9]+_[a-z0-9]+$/i.test(clean);

    if (isStopToken) {
      const loc = localizePlaceName(clean, '', targetLang);
      if (loc) return loc;
    }

    if (targetLang === 'en') {
      if (/[а-яё]/i.test(clean)) {
        const ruLower = clean.toLowerCase();
        if (RUSSIAN_TO_ENGLISH_CITIES_DB[ruLower]) return RUSSIAN_TO_ENGLISH_CITIES_DB[ruLower];
        return formatToTitleCase(transliterateCyrillicToLatin(clean));
      }
      return clean.replace(/_+/g, ' ').trim();
    } else {
      const norm = normalizeCityKey(clean);
      if (CITIES_DB[norm] && CITIES_DB[norm].ru) {
        return CITIES_DB[norm].ru;
      }
      return clean.replace(/_+/g, ' ').trim();
    }
  }

  /* ==========================================================================
     СЛОВАРЬ ГРУЗОВ (CARGO TRANSLATIONS)
     ========================================================================== */
  const CARGO_TRANSLATIONS = {
    passengers: { ru: 'Пассажирский рейс', en: 'Passengers' },
    passenger: { ru: 'Пассажирский рейс', en: 'Passengers' },
    electronics: { ru: 'Электроника', en: 'Electronics' },
    apples: { ru: 'Яблоки', en: 'Apples' },
    cars: { ru: 'Автомобили', en: 'Cars' },
    diesel: { ru: 'Дизель', en: 'Diesel' },
    petrol: { ru: 'Бензин', en: 'Petrol' },
    gasoline: { ru: 'Бензин', en: 'Gasoline' },
    grain: { ru: 'Зерно', en: 'Grain' },
    wheat: { ru: 'Пшеница', en: 'Wheat' },
    barley: { ru: 'Ячмень', en: 'Barley' },
    milk: { ru: 'Молоко', en: 'Milk' },
    flour: { ru: 'Мука', en: 'Flour' },
    meat: { ru: 'Мясо', en: 'Meat' },
    pork: { ru: 'Свинина', en: 'Pork' },
    beef: { ru: 'Говядина', en: 'Beef' },
    chicken: { ru: 'Курица', en: 'Chicken' },
    fish: { ru: 'Рыба', en: 'Fish' },
    potatoes: { ru: 'Картофель', en: 'Potatoes' },
    tomatoes: { ru: 'Помидоры', en: 'Tomatoes' },
    sugar: { ru: 'Сахар', en: 'Sugar' },
    salt: { ru: 'Соль', en: 'Salt' },
    timber: { ru: 'Бревна', en: 'Timber' },
    logs: { ru: 'Бревна', en: 'Logs' },
    lumber: { ru: 'Пиломатериалы', en: 'Lumber' },
    wood: { ru: 'Древесина', en: 'Wood' },
    wood_chips: { ru: 'Древесная щепа', en: 'Wood Chips' },
    woodchips: { ru: 'Древесная щепа', en: 'Wood Chips' },
    gravel: { ru: 'Гравий', en: 'Gravel' },
    sand: { ru: 'Песок', en: 'Sand' },
    coal: { ru: 'Уголь', en: 'Coal' },
    iron: { ru: 'Железо', en: 'Iron' },
    steel: { ru: 'Сталь', en: 'Steel' },
    copper: { ru: 'Медь', en: 'Copper' },
    chemicals: { ru: 'Химикаты', en: 'Chemicals' },
    fertilizer: { ru: 'Удобрения', en: 'Fertilizer' },
    furniture: { ru: 'Мебель', en: 'Furniture' },
    glass: { ru: 'Стекло', en: 'Glass' },
    tires: { ru: 'Шины', en: 'Tires' },
    paper: { ru: 'Бумага', en: 'Paper' },
    beverages: { ru: 'Напитки', en: 'Beverages' },
    clothes: { ru: 'Одежда', en: 'Clothes' },
    toys: { ru: 'Игрушки', en: 'Toys' },
    explosives: { ru: 'Взрывчатка', en: 'Explosives' },
    fireworks: { ru: 'Фейерверки', en: 'Fireworks' },
    yacht: { ru: 'Яхта', en: 'Yacht' },
    tractor: { ru: 'Трактор', en: 'Tractor' },
    excavator: { ru: 'Экскаватор', en: 'Excavator' },
    bulldozer: { ru: 'Бульдозер', en: 'Bulldozer' },
    heavy_machinery: { ru: 'Тяжелая техника', en: 'Heavy Machinery' },
    medical_supplies: { ru: 'Медикаменты', en: 'Medical Supplies' },
    vaccines: { ru: 'Вакцины', en: 'Vaccines' }
  };

  const RUSSIAN_TO_ENGLISH_CARGO_DB = Object.create(null);
  Object.keys(CARGO_TRANSLATIONS).forEach((key) => {
    const entry = CARGO_TRANSLATIONS[key];
    if (entry && entry.ru && entry.en) {
      RUSSIAN_TO_ENGLISH_CARGO_DB[entry.ru.toLowerCase()] = entry.en;
    }
  });

  function localizeCargoName(rawCargo, targetLang) {
    if (!rawCargo || typeof rawCargo !== 'string') return '';
    const clean = rawCargo.trim();
    if (!clean) return '';

    const effectiveTargetLang = (targetLang === 'en' || targetLang === 'ru') ? targetLang : 'ru';
    const norm = clean.toLowerCase().replace(/[\s\-_]+/g, '_');
    const normAlpha = clean.toLowerCase().replace(/[^a-z0-9]/g, '');

    const dictMatch = CARGO_TRANSLATIONS[norm] || CARGO_TRANSLATIONS[normAlpha];
    const hasCyrillic = /[а-яё]/i.test(clean);

    if (effectiveTargetLang === 'ru') {
      if (hasCyrillic) return clean;
      if (dictMatch && dictMatch.ru) return dictMatch.ru;
      if (clean.toLowerCase() === 'passengers' || clean.toLowerCase() === 'passenger') return t('coachPassengerRoute');
      return transliterateLatinToCyrillic(formatToTitleCase(clean));
    } else {
      if (dictMatch && dictMatch.en) return dictMatch.en;
      if (hasCyrillic) {
        const ruLower = clean.toLowerCase();
        if (RUSSIAN_TO_ENGLISH_CARGO_DB[ruLower]) return RUSSIAN_TO_ENGLISH_CARGO_DB[ruLower];
        return formatToTitleCase(transliterateCyrillicToLatin(clean));
      }
      return formatToTitleCase(clean.replace(/_+/g, ' '));
    }
  }

  function extractCargoFromContainer(container) {
    if (!container) return '';
    if (typeof container === 'string') {
      return pickValidCargoText([container]);
    }
    if (typeof container !== 'object' || isContainerJobInactive(container)) {
      return '';
    }

    const cargoObj = container.cargo && typeof container.cargo === 'object' && !isContainerJobInactive(container.cargo)
      ? container.cargo
      : null;
    const jobObj = container.job && typeof container.job === 'object' && !isContainerJobInactive(container.job)
      ? container.job
      : null;
    const jobCargoObj = jobObj && jobObj.cargo && typeof jobObj.cargo === 'object' && !isContainerJobInactive(jobObj.cargo)
      ? jobObj.cargo
      : null;

    return pickValidCargoText([
      container.cargoName,
      typeof container.cargo === 'string' ? container.cargo : null,
      cargoObj ? (cargoObj.cargoName ?? cargoObj.name ?? cargoObj.cargo) : null,
      jobObj ? jobObj.cargoName : null,
      jobObj && typeof jobObj.cargo === 'string' ? jobObj.cargo : null,
      jobCargoObj ? (jobCargoObj.cargoName ?? jobCargoObj.name ?? jobCargoObj.cargo) : null,
      container.jobName
    ]);
  }

  function hasMeaningfulCargoOrJob(val) {
    if (val === undefined || val === null || val === false || val === '') return false;
    if (typeof val === 'number') return Number.isFinite(val) && val > 0;
    if (typeof val === 'string') {
      return Boolean(pickValidCargoText([val]));
    }
    if (Array.isArray(val)) return val.some(hasMeaningfulCargoOrJob);
    if (typeof val === 'object') {
      if (isContainerJobInactive(val)) return false;
      return Object.keys(val).some((key) => {
        if (key === 'damage' || key === 'cargoDamage') return false;
        return hasMeaningfulCargoOrJob(val[key]);
      });
    }
    return false;
  }

  function extractRawCargoName(data) {
    if (!data || typeof data !== 'object') return '';
    if (isContainerJobInactive(data)) return '';

    const tripCargo = extractCargoFromContainer(data.trip);
    if (tripCargo) return tripCargo;

    const tripExplicitlyInactive = Boolean(
      data.trip && typeof data.trip === 'object' && isContainerJobInactive(data.trip)
    );
    const allowCfgCargo = !tripExplicitlyInactive || hasExplicitContainerActiveFlag(data.cfg);
    if (allowCfgCargo) {
      const cfgCargo = extractCargoFromContainer(data.cfg);
      if (cfgCargo) return cfgCargo;
    }

    const telCargo = extractCargoFromContainer(data);
    if (telCargo) return telCargo;

    if (data.tel && typeof data.tel === 'object') {
      return extractCargoFromContainer(data.tel);
    }
    return '';
  }

  function extractCargoName(data) {
    const raw = extractRawCargoName(data);
    if (!raw) return '';
    return localizeCargoName(raw, lang);
  }

  function resolveTrailerAndCargoState(data, jobState) {
    const cargoName = extractCargoName(data);
    const cargoLower = (cargoName || '').toLowerCase();
    const isCargoPassengers = cargoLower.includes('пассажир') || cargoLower.includes('passenger');
    const massKg = jobState && jobState.massKg;
    const massText = (massKg !== null && massKg !== undefined && Number.isFinite(massKg) && massKg > 0)
      ? formatCargoMassTons(massKg)
      : '';

    // Эталонная проверка автобусного рейса (DLC Coaches / bus_job):
    // При наличии реального груза с массой (не пассажиры) - это всегда грузовой рейс!
    const isBusJob = Boolean(
      (jobState && jobState.isBusJob) ||
      (data && (data.isBusJob || data.busJob || (data.trip && (data.trip.isBusJob || data.trip.busJob || data.trip.marketType === 'bus_job')))) ||
      (data && data.cfg && data.cfg.job && (data.cfg.job.busJob || data.cfg.job.isBusJob || data.cfg.job.market === 'bus_job')) ||
      isCargoPassengers
    ) && (!cargoName || isCargoPassengers || (massKg === 0 && !cargoName));

    if (isBusJob) {
      const busSat = parseFiniteTelemetryNumber(
        data.busSat ?? (data.tel && data.tel.busSat) ?? (data.trip && data.trip.busSat) ?? (data.cfg && data.cfg.bus && data.cfg.bus.satisfaction)
      );
      let passengerText = t('coachPassengerRoute');
      if (busSat !== null && busSat > 0) {
        const satPct = Math.round(busSat > 1 ? busSat : busSat * 100);
        passengerText = `${t('coachPassengerRoute')} • ${t('comfortLabel')}: ${satPct}%`;
      }
      return {
        connected: true,
        hasCargo: true,
        text: passengerText,
        title: t('coachPassengerTitle'),
        statusClass: 'is-ok'
      };
    }

    if (cargoName) {
      const upperCargo = cargoName.toUpperCase();
      const cargoWithMass = massText ? `${upperCargo} • ${massText}` : upperCargo;
      return {
        connected: true,
        hasCargo: true,
        text: cargoWithMass,
        title: `${t('cargoPrefix')} ${upperCargo}${massText ? ' (' + massText + ')' : ''}`,
        statusClass: 'is-ok'
      };
    }

    if (isTrailerConnected(data)) {
      return {
        connected: true,
        hasCargo: false,
        text: t('trailerAttachedEmpty'),
        title: t('trailerEmptyTitle'),
        statusClass: 'is-warn'
      };
    }

    return {
      connected: false,
      hasCargo: false,
      text: t('noTrailer'),
      title: t('noTrailerTitle'),
      statusClass: 'is-detached'
    };
  }

  function parseFiniteTelemetryNumber(val) {
    if (val === undefined || val === null || val === '') return null;
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  }

  function formatIntWithSpaces(num) {
    const rounded = Math.round(num);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function sanitizeTruckText(val) {
    if (typeof val !== 'string') return '';
    const clean = val.trim();
    const lower = clean.toLowerCase();
    if (!clean || lower === 'null' || lower === 'undefined' ||
        lower === 'none' || lower === 'n/a' || clean === '-' || clean === '--') {
      return '';
    }
    return clean;
  }

  function resolveTruckIdentity(data) {
    const cfg = data && data.cfg && typeof data.cfg === 'object' ? data.cfg : null;
    const cfgTruck = cfg && cfg.truck && typeof cfg.truck === 'object' ? cfg.truck : null;
    const dataTruck = data && data.truck && typeof data.truck === 'object' ? data.truck : null;

    const brand = sanitizeTruckText(
      data.truckBrand ??
      (dataTruck && dataTruck.brand) ??
      (cfgTruck && cfgTruck.brand) ??
      (cfg && cfg['truck.brand']) ??
      (cfg && cfg.truckBrand)
    );
    const name = sanitizeTruckText(
      data.truckName ??
      (dataTruck && dataTruck.name) ??
      (cfgTruck && cfgTruck.name) ??
      (cfg && cfg['truck.name']) ??
      (cfg && cfg.truckName)
    );
    const plate = sanitizeTruckText(
      data.licensePlate ??
      (dataTruck && dataTruck.license && dataTruck.license.plate) ??
      (dataTruck && dataTruck.licensePlate) ??
      (cfgTruck && cfgTruck.license && cfgTruck.license.plate) ??
      (cfgTruck && cfgTruck.licensePlate) ??
      (cfg && cfg['truck.license.plate']) ??
      (cfg && cfg.licensePlate)
    );

    let modelText = t('truckStandby');
    if (brand && name) {
      modelText = name.toLowerCase().startsWith(brand.toLowerCase())
        ? name.toUpperCase()
        : `${brand} ${name}`.toUpperCase();
    } else if (brand || name) {
      modelText = (brand || name).toUpperCase();
    }

    return {
      brand,
      name,
      modelText,
      plateText: plate ? plate.toUpperCase() : ''
    };
  }

  function resolveGameId(data, brandText) {
    const rawGame = sanitizeTruckText(
      (data && (data.game ?? (data.srv && data.srv.game) ?? (data.cfg && (data.cfg.game ?? data.cfg['game.id'])))) || ''
    ).toLowerCase();

    if (rawGame === 'ats' || rawGame.includes('american')) return 'ATS';
    if (rawGame === 'ets2' || rawGame.includes('euro')) return 'ETS2';

    const probe = String(brandText || '').toLowerCase();
    if (probe && ATS_BRANDS.some((b) => probe.includes(b))) {
      return 'ATS';
    }
    return 'ETS2';
  }

  function formatTruckFuelAvg(rawFuelAvg, speedKmh) {
    const val = parseFiniteTelemetryNumber(rawFuelAvg);
    if (val === null || val <= 0 || speedKmh <= 0) return '—';
    return `${val.toFixed(1)} ${t('l100Short')}`;
  }

  function formatOilWaterTemps(rawOil, rawWater) {
    const oil = parseFiniteTelemetryNumber(rawOil);
    const water = parseFiniteTelemetryNumber(rawWater);
    if (oil === null && water === null) return '--';
    const oilText = oil !== null ? `${Math.round(oil)}°` : '--';
    const waterText = water !== null ? `${Math.round(water)}°` : '--';
    return `${oilText} / ${waterText}`;
  }

  function formatAirPressure(rawAir) {
    const air = parseFiniteTelemetryNumber(rawAir);
    if (air === null || air < 0) return '--';
    const barVal = air > 20 ? air * 0.0689476 : air;
    return `${barVal.toFixed(1)} ${t('barUnit')}`;
  }

  function formatAdblueLiters(rawAdblue) {
    const val = parseFiniteTelemetryNumber(rawAdblue);
    if (val === null || val < 0) return '--';
    return `${Math.round(val)} ${t('l')}`;
  }

  function formatBatteryVoltage(rawBattery) {
    const val = parseFiniteTelemetryNumber(rawBattery);
    if (val === null || val < 0) return '--';
    return `${val.toFixed(1)} ${t('voltUnit')}`;
  }

  function formatFuelRangeKm(rawRange) {
    const val = parseFiniteTelemetryNumber(rawRange);
    if (val === null || val < 0) return '--';
    return `${formatIntWithSpaces(val)} ${t('km')}`;
  }

  function resolveActiveJobContainers(data) {
    if (!data || typeof data !== 'object' || isContainerJobInactive(data)) return [];
    const containers = [];
    const tripExplicitlyInactive = Boolean(
      data.trip && typeof data.trip === 'object' && isContainerJobInactive(data.trip)
    );
    if (data.trip && typeof data.trip === 'object' && !tripExplicitlyInactive) {
      containers.push(data.trip);
    }
    const allowCfg = !tripExplicitlyInactive || hasExplicitContainerActiveFlag(data.cfg);
    if (allowCfg && data.cfg && typeof data.cfg === 'object' && !isContainerJobInactive(data.cfg)) {
      containers.push(data.cfg);
    }
    if (!tripExplicitlyInactive) {
      containers.push(data);
    }
    return containers;
  }

  function extractEndpointFieldFromContainer(container, kind, propName) {
    if (!container || typeof container !== 'object' || isContainerJobInactive(container)) {
      return '';
    }
    const capProp = propName.charAt(0).toUpperCase() + propName.slice(1);
    const stopKind = kind === 'source' ? 'source_stop' : 'destination_stop';
    const stopKindCamel = kind === 'source' ? 'sourceStop' : 'destinationStop';

    const candidates = [
      container[kind],
      container[stopKind],
      container[stopKindCamel],
      container.bus && container.bus[stopKindCamel],
      container.bus && container.bus[kind],
      container.bus_job && (container.bus_job[stopKind] || container.bus_job[stopKindCamel] || container.bus_job[kind])
    ];

    for (let i = 0; i < candidates.length; i += 1) {
      const node = candidates[i];
      if (node && typeof node === 'object') {
        const val = node[propName] ?? (propName === 'city' ? (node.name || node.city_name) : (node.company || node.station));
        const picked = pickValidPlaceText([val]);
        if (picked) return picked;
      } else if (typeof node === 'string' && propName === 'city') {
        const picked = pickValidPlaceText([node]);
        if (picked) return picked;
      }
    }

    const flatPicked = pickValidPlaceText([
      container[`${kind}.${propName}`],
      container[`${kind}${capProp}`],
      container[`${stopKind}.${propName}`],
      container[`${stopKindCamel}${capProp}`],
      container[`${stopKindCamel}.${propName}`],
      container[`${stopKind}_${propName}`]
    ]);
    if (flatPicked) return flatPicked;

    const jobObj = container.job && typeof container.job === 'object' && !isContainerJobInactive(container.job)
      ? container.job
      : null;
    return jobObj ? extractEndpointFieldFromContainer(jobObj, kind, propName) : '';
  }

  function extractEndpointIdFromContainer(container, kind) {
    if (!container || typeof container !== 'object' || isContainerJobInactive(container)) {
      return '';
    }
    const stopKind = kind === 'source' ? 'source_stop' : 'destination_stop';
    const stopKindCamel = kind === 'source' ? 'sourceStop' : 'destinationStop';

    const candidates = [
      container[`${kind}CityId`],
      container[`${kind}.cityId`],
      container[`${kind}.id`],
      container[`${kind}Id`],
      container[`${stopKindCamel}CityId`],
      container[`${stopKind}.id`],
      container[`${stopKindCamel}.id`],
      container[kind] && (container[kind].cityId || container[kind].id),
      container[stopKind] && (container[stopKind].cityId || container[stopKind].id),
      container[stopKindCamel] && (container[stopKindCamel].cityId || container[stopKindCamel].id),
      container.bus && container.bus[stopKindCamel] && (container.bus[stopKindCamel].cityId || container.bus[stopKindCamel].id),
      container.bus && container.bus[kind] && (container.bus[kind].cityId || container.bus[kind].id)
    ];

    for (let i = 0; i < candidates.length; i += 1) {
      const val = candidates[i];
      if (typeof val === 'string' && val.trim()) {
        const cleaned = cleanStopOrPlaceIdentifier(val);
        if (cleaned && !INVALID_PLACE_NAMES.has(cleaned.toLowerCase())) {
          return cleaned;
        }
      }
    }

    const jobObj = container.job && typeof container.job === 'object' && !isContainerJobInactive(container.job)
      ? container.job
      : null;
    return jobObj ? extractEndpointIdFromContainer(jobObj, kind) : '';
  }

  function extractJobStringFromContainer(container, flatKeys, nestedObjKey, nestedPropKey) {
    if (!container || typeof container !== 'object' || isContainerJobInactive(container)) {
      return '';
    }
    for (let i = 0; i < flatKeys.length; i += 1) {
      const candidate = pickValidCargoText([container[flatKeys[i]]]);
      if (candidate) return candidate;
    }
    const nestedObj = container[nestedObjKey];
    if (nestedObj && typeof nestedObj === 'object' && !isContainerJobInactive(nestedObj)) {
      const nestedCandidate = pickValidCargoText([nestedObj[nestedPropKey]]);
      if (nestedCandidate) return nestedCandidate;
    }
    const jobObj = container.job;
    if (jobObj && typeof jobObj === 'object' && !isContainerJobInactive(jobObj)) {
      return extractJobStringFromContainer(jobObj, flatKeys, nestedObjKey, nestedPropKey);
    }
    return '';
  }

  function extractPositiveJobMetric(container, flatKeys, nestedObjKey, nestedPropKey) {
    if (!container || typeof container !== 'object' || isContainerJobInactive(container)) {
      return null;
    }
    for (let i = 0; i < flatKeys.length; i += 1) {
      const val = parseFiniteTelemetryNumber(container[flatKeys[i]]);
      if (val !== null && val > 0) return val;
    }
    const nestedObj = container[nestedObjKey];
    if (nestedObj && typeof nestedObj === 'object' && !isContainerJobInactive(nestedObj)) {
      const nestedVal = parseFiniteTelemetryNumber(nestedObj[nestedPropKey]);
      if (nestedVal !== null && nestedVal > 0) return nestedVal;
    }
    const jobObj = container.job;
    if (jobObj && typeof jobObj === 'object' && !isContainerJobInactive(jobObj)) {
      return extractPositiveJobMetric(jobObj, flatKeys, nestedObjKey, nestedPropKey);
    }
    return null;
  }

  function formatCargoMassTons(massKg) {
    if (massKg === null || !Number.isFinite(massKg) || massKg <= 0) return '';
    const roundedTons = Math.round((massKg / 1000) * 10) / 10;
    if (roundedTons <= 0) return '';
    const tonsStr = Number.isInteger(roundedTons) ? String(roundedTons) : roundedTons.toFixed(1);
    return `${tonsStr} ${t('t')}`;
  }

  function translateJobMarket(rawMarket) {
    const clean = sanitizeTruckText(rawMarket);
    if (!clean) return '';
    const normalizedKey = clean.toLowerCase().replace(/[\s-]+/g, '_');
    const dict = (I18N[lang] && I18N[lang].jobMarkets) || I18N.ru.jobMarkets;
    if (dict[normalizedKey]) return dict[normalizedKey];
    return clean.replace(/_/g, ' ').toUpperCase();
  }

  function resolveJobAndRouteState(data, gameId, navInputs) {
    const defaultTag = (config.ets2 && config.ets2.routeTag) || 'ETS2 // ATS';
    if (!data || typeof data !== 'object') {
      return {
        hasJob: false,
        isCoach: false,
        isGpsRoute: false,
        text: '--',
        meta: '--',
        tag: defaultTag,
        plannedKm: null,
        incomeText: '--',
        companiesText: '--',
        jobTypeText: '--'
      };
    }

    const rawGame = sanitizeTruckText(data.game ?? (data.cfg && data.cfg.game));
    const tag = rawGame ? rawGame.toUpperCase() : (gameId || defaultTag);

    const containers = resolveActiveJobContainers(data);
    let srcCity = '';
    let dstCity = '';
    let srcCityId = '';
    let dstCityId = '';
    let srcCompany = '';
    let dstCompany = '';
    let massKg = null;
    let plannedKm = null;
    let income = null;
    let jobMarket = '';
    let isBusJobFlag = false;

    containers.forEach((c) => {
      if (!srcCity) srcCity = extractEndpointFieldFromContainer(c, 'source', 'city');
      if (!dstCity) dstCity = extractEndpointFieldFromContainer(c, 'destination', 'city');
      if (!srcCityId) srcCityId = extractEndpointIdFromContainer(c, 'source');
      if (!dstCityId) dstCityId = extractEndpointIdFromContainer(c, 'destination');
      if (!srcCompany) srcCompany = extractEndpointFieldFromContainer(c, 'source', 'company');
      if (!dstCompany) dstCompany = extractEndpointFieldFromContainer(c, 'destination', 'company');
      if (massKg === null) {
        massKg = extractPositiveJobMetric(c, ['cargo.mass', 'cargoMassKg', 'cargoMass', 'mass'], 'cargo', 'mass');
      }
      if (plannedKm === null) {
        plannedKm = extractPositiveJobMetric(c, ['planned_distance.km', 'plannedDistanceKm', 'plannedDistance'], 'planned_distance', 'km');
      }
      if (income === null) {
        income = extractPositiveJobMetric(c, ['income', 'revenue', 'job.income', 'job.revenue'], 'job', 'income');
      }
      if (!jobMarket) {
        jobMarket = extractJobStringFromContainer(c, ['job.market', 'jobMarket', 'market'], 'job', 'market');
      }
      if (!isBusJobFlag) {
        if (c.job && (c.job.busJob || c.job.isBusJob)) isBusJobFlag = true;
        if (c.busJob || c.isBusJob) isBusJobFlag = true;
      }
    });

    // 100% раздельная локализация и очистка названий городов и остановок (RU / EN)
    srcCity = localizePlaceName(srcCity, srcCityId, lang);
    dstCity = localizePlaceName(dstCity, dstCityId, lang);
    srcCompany = cleanAndFormatStopOrCompany(srcCompany, lang);
    dstCompany = cleanAndFormatStopOrCompany(dstCompany, lang);

    const effectiveSrc = srcCity || srcCompany;
    const effectiveDst = dstCity || dstCompany;

    const cargoName = extractCargoName(data);
    const cargoLower = (cargoName || '').toLowerCase();
    const isCargoPassengers = cargoLower.includes('пассажир') || cargoLower.includes('passenger');

    // Сценарий 1: Рейс с заданным пунктом назначения/отправления (груз или автобусный маршрут)
    const hasJobFromEndpoints = Boolean(
      cargoName ||
      (effectiveSrc && effectiveDst) ||
      effectiveDst ||
      effectiveSrc ||
      (income !== null && income > 0) ||
      (plannedKm !== null && plannedKm > 0)
    );

    // Эталонная дифференциация типа рейса (SCS Telemetry SDK 1.16 / rtrucksim_telemetry):
    // При наличии реального груза (не пассажиры) с ненулевой массой — это всегда ГРУЗОВОЙ рейс,
    // даже если тягач из модов построен на автобусном шасси!
    let isBusJob = Boolean(
      (data.cfg && data.cfg.isBusJob) ||
      (data.cfg && data.cfg.job && (data.cfg.job.busJob || data.cfg.job.isBusJob || data.cfg.job.market === 'bus_job')) ||
      data.isBusJob ||
      data.busJob ||
      (data.trip && (data.trip.isBusJob || data.trip.busJob || data.trip.marketType === 'bus_job')) ||
      (data.job && (data.job.busJob || data.job.isBusJob || data.job.jobType === 'bus_job')) ||
      jobMarket === 'bus_job' ||
      isBusJobFlag ||
      isCargoPassengers
    );

    if (cargoName && !isCargoPassengers && (massKg === null || massKg > 0)) {
      isBusJob = false;
    }

    const apiCfg = (config.ets2 && config.ets2.telemetryApi) || {};
    const effectiveNavInputs = navInputs || resolveNavInputs(data);
    const navMeters = resolveNavDistanceMeters(effectiveNavInputs.navDist, apiCfg);

    // Сценарий 2: Маршрут GPS между промежуточными остановками или свободная навигация по GPS
    const isGpsRoute = !hasJobFromEndpoints && navMeters !== null && navMeters > 50;

    const hasJob = hasJobFromEndpoints || isGpsRoute;

    const metaText = plannedKm !== null ? `${formatIntWithSpaces(plannedKm)} ${t('km')}` : t('enRouteMeta');

    let routeText = t('freeRoam');
    let routeMeta = t('liveMeta');

    if (hasJobFromEndpoints) {
      if (srcCity && dstCity && srcCity.toLowerCase() !== dstCity.toLowerCase()) {
        routeText = `${srcCity.toUpperCase()} → ${dstCity.toUpperCase()}`;
        routeMeta = metaText;
      } else if (srcCompany && dstCompany && srcCompany.toLowerCase() !== dstCompany.toLowerCase()) {
        routeText = (srcCity && dstCity && srcCity.toLowerCase() === dstCity.toLowerCase())
          ? `${srcCity.toUpperCase()}: ${srcCompany.toUpperCase()} → ${dstCompany.toUpperCase()}`
          : `${srcCompany.toUpperCase()} → ${dstCompany.toUpperCase()}`;
        routeMeta = metaText;
      } else if (effectiveSrc && effectiveDst) {
        routeText = `${effectiveSrc.toUpperCase()} → ${effectiveDst.toUpperCase()}`;
        routeMeta = metaText;
      } else if (effectiveDst) {
        routeText = `→ ${effectiveDst.toUpperCase()}`;
        routeMeta = metaText;
      } else if (effectiveSrc) {
        routeText = `${effectiveSrc.toUpperCase()} →`;
        routeMeta = metaText;
      } else if (cargoName) {
        routeText = cargoName.toUpperCase();
        routeMeta = metaText;
      }
    } else if (isGpsRoute) {
      routeText = t('gpsRouteNextStop');
      routeMeta = formatNavText(effectiveNavInputs.navDist, effectiveNavInputs.navTime, apiCfg);
    }

    const currency = gameId === 'ATS' ? '$' : '€';
    const incomeText = hasJobFromEndpoints && income !== null
      ? `${currency} ${formatIntWithSpaces(income)}`
      : (hasJobFromEndpoints ? '--' : (isGpsRoute ? '--' : t('freeRoam')));

    let companiesText = hasJob ? '--' : t('freeRoam');
    if (srcCompany && dstCompany) {
      const compRoute = `${srcCompany.toUpperCase()} → ${dstCompany.toUpperCase()}`;
      if (compRoute !== routeText) {
        companiesText = compRoute;
      } else if (isBusJob) {
        const busSat = parseFiniteTelemetryNumber(
          data.busSat ?? (data.tel && data.tel.busSat) ?? (data.trip && data.trip.busSat) ?? (data.cfg && data.cfg.bus && data.cfg.bus.satisfaction)
        );
        if (busSat !== null && busSat > 0) {
          const satPct = Math.round(busSat > 1 ? busSat : busSat * 100);
          companiesText = `${t('comfortLabel')}: ${satPct}%`;
        } else {
          companiesText = t('coachPassengerRoute');
        }
      } else {
        companiesText = srcCompany.toUpperCase();
      }
    } else if (srcCompany || dstCompany) {
      const singleComp = (srcCompany || dstCompany).toUpperCase();
      companiesText = singleComp !== routeText ? singleComp : '--';
    } else if (isBusJob) {
      const busSat = parseFiniteTelemetryNumber(
        data.busSat ?? (data.tel && data.tel.busSat) ?? (data.trip && data.trip.busSat) ?? (data.cfg && data.cfg.bus && data.cfg.bus.satisfaction)
      );
      if (busSat !== null && busSat > 0) {
        const satPct = Math.round(busSat > 1 ? busSat : busSat * 100);
        companiesText = `${t('comfortLabel')}: ${satPct}%`;
      }
    }

    const translatedMarket = translateJobMarket(jobMarket);
    let jobTypeText = t('freeRoam');
    if (hasJobFromEndpoints) {
      if (isBusJob) {
        jobTypeText = t('coachPassengerRoute');
      } else {
        jobTypeText = translatedMarket || t('freightJob');
      }
    } else if (isGpsRoute) {
      jobTypeText = t('gpsRouteNextStop');
    }

    const routeTag = hasJobFromEndpoints
      ? (isBusJob ? t('coachPassengerRoute') : (tag || defaultTag))
      : (isGpsRoute ? t('gpsRouteNextStop') : (tag || defaultTag));

    return {
      hasJob,
      isBusJob,
      isCoach: isBusJob,
      isGpsRoute,
      text: routeText,
      routeText,
      meta: routeMeta,
      distanceText: routeMeta,
      tag: routeTag,
      massKg,
      plannedKm,
      income,
      incomeText,
      companiesText,
      jobTypeText
    };
  }

  const TRUCK_WEAR_KEYS = ['wEngine', 'wTrans', 'wChassis', 'wWheels', 'wCabin'];

  function normalizeWearToHealthPct(rawWear) {
    const raw = parseFiniteTelemetryNumber(rawWear);
    if (raw === null || raw < 0) return null;
    const ratio = raw > 1 ? Math.min(1, raw / 100) : Math.min(1, raw);
    return Math.max(0, Math.min(100, Math.round((1 - ratio) * 100)));
  }

  function resolveTruckHealthPct(data) {
    if (!data || typeof data !== 'object') return null;
    let maxWear = null;
    TRUCK_WEAR_KEYS.forEach((key) => {
      const raw = parseFiniteTelemetryNumber(data[key]);
      if (raw === null || raw < 0) return;
      const ratio = raw > 1 ? Math.min(1, raw / 100) : Math.min(1, raw);
      if (maxWear === null || ratio > maxWear) {
        maxWear = ratio;
      }
    });
    if (maxWear === null) return null;
    return Math.max(0, Math.min(100, Math.round((1 - maxWear) * 100)));
  }

  function resolveTrailerHealthPct(data, trailerConnected) {
    if (!data || typeof data !== 'object' || !trailerConnected) return null;
    const rawTrailerWear = data.wTrailer ??
      data.trailerWear ??
      (data.trailer && typeof data.trailer === 'object' && data.trailer.wear
        ? (data.trailer.wear.chassis ?? data.trailer.wear.body)
        : undefined);
    return normalizeWearToHealthPct(rawTrailerWear);
  }

  function resolveCargoHealthPct(data, hasActiveJobOrCargo) {
    if (!data || typeof data !== 'object' || !hasActiveJobOrCargo) return null;
    const rawCargoDmg = parseFiniteTelemetryNumber(data.cargoDmg);
    const rawJobDmg = parseFiniteTelemetryNumber(data.jobDmg);
    const candidates = [rawCargoDmg, rawJobDmg].filter((v) => v !== null && v >= 0);
    if (candidates.length === 0) return null;
    const maxDmg = Math.max(...candidates);
    return normalizeWearToHealthPct(maxDmg);
  }

  function applyDashboardIndicators(data) {
    const active = Boolean(data && typeof data === 'object');
    const blinkL = active && isTruthyTelemetryFlag(data.blinkL);
    const blinkR = active && isTruthyTelemetryFlag(data.blinkR);
    const hazardOn = active && isTruthyTelemetryFlag(data.hazard);

    if (!active || !hazardOn) {
      lastHazardLiveBlinkAt = 0;
    } else if (blinkL || blinkR) {
      lastHazardLiveBlinkAt = Date.now();
    }

    // Если hazard=true, но реальные каналы blinkL/blinkR не мигают (например, в демо-режиме),
    // включаем CSS-мигание .is-blinking, иначе стрелки синхронно повторяют импульсы движка.
    const fallbackHazardBlink =
      hazardOn &&
      !blinkL &&
      !blinkR &&
      (lastHazardLiveBlinkAt === 0 || (Date.now() - lastHazardLiveBlinkAt) > 1000);

    const retarderNum = active ? parseFiniteTelemetryNumber(data.retarder) : null;
    const retarderOn = active && (
      (retarderNum !== null ? retarderNum > 0 : isTruthyTelemetryFlag(data.retarder)) ||
      isTruthyTelemetryFlag(data.motorBrake)
    );

    const ccRawInd = active
      ? (data.cruise ?? data.cc ?? data.cruiseControl ?? (data.tel && (data.tel.cruise ?? data.tel.cc ?? data.tel.cruiseControl)) ?? 0)
      : 0;
    const ccSpeedInd = typeof ccRawInd === 'object' && ccRawInd !== null
      ? Number(ccRawInd.speed ?? ccRawInd.value ?? 0)
      : Number(ccRawInd);
    const isCcIndActive = active && Boolean(
      isTruthyTelemetryFlag(data.cruiseOn) ||
      (data.tel && isTruthyTelemetryFlag(data.tel.cruiseOn)) ||
      isTruthyTelemetryFlag(data.cruise) ||
      (Number.isFinite(ccSpeedInd) && ccSpeedInd > 0)
    );

    const fogOn = active && (
      isTruthyTelemetryFlag(data.fogLight) ||
      isTruthyTelemetryFlag(data.auxFront) ||
      isTruthyTelemetryFlag(data.auxRoof)
    );
    const restStopMin = active ? parseFiniteTelemetryNumber(data.restStop) : null;
    const restWarnOn = active && (
      isTruthyTelemetryFlag(data.restWarn) ||
      isTruthyTelemetryFlag(data.fatigueWarn) ||
      (restStopMin !== null && restStopMin > 0 && restStopMin <= 120)
    );

    const states = [
      ['lt-ind-blink-l', blinkL],
      ['lt-ind-blink-r', blinkR],
      ['lt-ind-hazard', hazardOn],
      ['lt-ind-park', active && isTruthyTelemetryFlag(data.parkLight)],
      ['lt-ind-low', active && isTruthyTelemetryFlag(data.lowBeam)],
      ['lt-ind-high', active && isTruthyTelemetryFlag(data.highBeam)],
      ['lt-ind-fog', fogOn],
      ['lt-ind-beacon', active && isTruthyTelemetryFlag(data.beacon)],
      ['lt-ind-cruise', isCcIndActive],
      ['lt-ind-wipers', active && isTruthyTelemetryFlag(data.wipers ?? data.wipersActive)],
      ['lt-ind-park-brake', active && isTruthyTelemetryFlag(data.parkBrake)],
      ['lt-ind-retarder', retarderOn],
      ['lt-ind-difflock', active && isTruthyTelemetryFlag(data.diffLock ?? data.differentialLock)],
      ['lt-ind-lift-axle', active && (isTruthyTelemetryFlag(data.liftAxle) || isTruthyTelemetryFlag(data.trailerLiftAxle))],
      ['lt-ind-fuel-warn', active && isTruthyTelemetryFlag(data.fuelWarn)],
      ['lt-ind-rest-warn', restWarnOn],
      ['lt-ind-air-warn', active && isTruthyTelemetryFlag(data.airWarn)],
      ['lt-ind-oil-warn', active && isTruthyTelemetryFlag(data.oilWarn ?? data.oilPressureWarning)],
      ['lt-ind-water-warn', active && isTruthyTelemetryFlag(data.waterWarn ?? data.waterTempWarning)],
      ['lt-ind-battery-warn', active && isTruthyTelemetryFlag(data.batteryWarn ?? data.batteryVoltageWarning)]
    ];

    states.forEach(([id, isOn]) => {
      const el = global.document.getElementById(id);
      if (el) {
        el.classList.toggle('is-active', Boolean(isOn));
        if (id === 'lt-ind-blink-l' || id === 'lt-ind-blink-r') {
          el.classList.toggle('is-blinking', fallbackHazardBlink);
        }
      }
    });
  }

  function resolveNavInputs(data) {
    if (!data || typeof data !== 'object') {
      return { navDist: undefined, navTime: undefined, scale: 0 };
    }
    const trip = data.trip && typeof data.trip === 'object' ? data.trip : null;
    const cfg = data.cfg && typeof data.cfg === 'object' ? data.cfg : null;
    const tel = data.tel && typeof data.tel === 'object' ? data.tel : null;
    const navDist = data.navDist !== undefined ? data.navDist : (trip && trip.navDist !== undefined ? trip.navDist : (tel && tel.navDist !== undefined ? tel.navDist : undefined));
    const navTime = data.navTime !== undefined ? data.navTime : (trip && trip.navTime !== undefined ? trip.navTime : (tel && tel.navTime !== undefined ? tel.navTime : undefined));
    const rawScale = data.scale ?? (cfg && (cfg.scale ?? cfg['game.scale'])) ?? (trip && trip.scale) ?? (tel && tel.scale);
    const parsedScale = parseFiniteTelemetryNumber(rawScale);
    return {
      navDist,
      navTime,
      scale: parsedScale !== null ? parsedScale : 0
    };
  }

  function resolveRealEtaState(navInputs, apiCfg) {
    if (!navInputs || typeof navInputs !== 'object') {
      return { active: false, text: '--', title: t('noRouteTitle') };
    }
    const distNum = parseFiniteTelemetryNumber(navInputs.navDist);
    const timeNum = parseFiniteTelemetryNumber(navInputs.navTime);

    if (distNum === null || distNum <= 0 || timeNum === null || timeNum <= 0) {
      return { active: false, text: '--', title: t('noRouteTitle') };
    }

    const navTimeSeconds = (apiCfg && apiCfg.navTimeUnit === 'min') ? timeNum * 60 : timeNum;
    const scale = Number(navInputs.scale) || 0;
    const effectiveScale = (scale && scale > 5) ? scale : 19;
    const realSeconds = navTimeSeconds / effectiveScale;

    if (!Number.isFinite(realSeconds) || realSeconds <= 0) {
      return { active: false, text: '--', title: t('noRouteTitle') };
    }

    let text;
    if (realSeconds < 60) {
      text = `< 1 ${t('min')}`;
    } else {
      const totalMins = Math.max(1, Math.round(realSeconds / 60));
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      text = hrs > 0
        ? `~${hrs} ${t('h')} ${String(mins).padStart(2, '0')} ${t('min')}`
        : `~${mins} ${t('min')}`;
    }

    return {
      active: true,
      text,
      title: `${t('realEtaLabel')} (~${Math.round(realSeconds)}s @ 1:${effectiveScale})`
    };
  }

  function applyRealEtaDisplay(etaState) {
    const panelEl = global.document.getElementById('real-eta-panel');
    const valEl = global.document.getElementById('real-eta-value');
    const isActive = Boolean(etaState && etaState.active);
    const displayText = (etaState && etaState.text) || '--';
    if (panelEl) {
      panelEl.classList.remove('is-hidden', 'is-fading-out');
      panelEl.classList.toggle('is-offline', !isActive);
      if (etaState && etaState.title) {
        panelEl.title = etaState.title;
      }
    }
    if (valEl) {
      valEl.textContent = displayText;
    }
  }

  function resolveTripStats(data, speedMult) {
    const trip = data && data.trip && typeof data.trip === 'object' ? data.trip : null;

    const rawDriven = parseFiniteTelemetryNumber(
      data.tripDriven ?? (trip && (trip.driven ?? trip.distance)) ?? data.driven
    );
    const rawLiters = parseFiniteTelemetryNumber(
      data.tripLiters ?? (trip && (trip.liters ?? trip.fuelUsed)) ?? data.liters
    );
    const rawAvg = parseFiniteTelemetryNumber(
      data.tripAvg ?? (trip && (trip.avg ?? trip.fuelAvg)) ?? data.avg
    );
    const rawMaxSpeed = parseFiniteTelemetryNumber(
      data.tripMaxSpeed ?? (trip && trip.maxSpeed) ?? data.maxSpeed
    );

    const drivenText = rawDriven !== null && rawDriven >= 0
      ? `${formatIntWithSpaces(rawDriven)} ${t('km')}`
      : '--';
    const litersText = rawLiters !== null && rawLiters >= 0
      ? `${formatIntWithSpaces(rawLiters)} ${t('l')}`
      : '--';
    const avgText = rawAvg !== null && rawAvg > 0
      ? `${rawAvg.toFixed(1)} ${t('l100')}`
      : '—';

    let maxSpeedText = '--';
    if (rawMaxSpeed !== null && rawMaxSpeed >= 0) {
      const kmh = rawMaxSpeed > 0 && speedMult === 3.6 && rawMaxSpeed < 50
        ? Math.round(rawMaxSpeed * speedMult)
        : Math.round(rawMaxSpeed);
      maxSpeedText = `${kmh} ${t('kmh')}`;
    }

    return { drivenText, litersText, avgText, maxSpeedText };
  }

  /* ==========================================================================
     МОДУЛЬ ИГРОВЫХ СОБЫТИЙ, ЗВУКОВОГО СИНТЕЗАТОРА И ТОСТ-УВЕДОМЛЕНИЙ
     ========================================================================== */
  const SPEED_LIMIT_STEPS = [30, 50, 60, 70, 80, 90, 110, 130];
  let lastValidSpeedLimit = 80;

  function snapToSpeedLimit(rawVal) {
    const val = Number(rawVal);
    if (!Number.isFinite(val) || val <= 0) return 80;
    let closest = SPEED_LIMIT_STEPS[0];
    let minDiff = Math.abs(val - closest);
    for (let i = 1; i < SPEED_LIMIT_STEPS.length; ++i) {
      const diff = Math.abs(val - SPEED_LIMIT_STEPS[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closest = SPEED_LIMIT_STEPS[i];
      }
    }
    return minDiff <= 5 ? closest : Math.round(val);
  }

    function generateSpeedLimitSignSvg(limit, isCamera = false) {
    const num = snapToSpeedLimit(limit);
    const isThreeDigit = num >= 100;
    const fontSize = isThreeDigit ? 16 : 22;
    const letterSpacing = isThreeDigit ? '-1.2px' : '0';
    const textY = isThreeDigit ? 38.5 : 39.5;

    const cameraAperture = isCamera ? `
      <!-- Camera radar optic badge -->
      <g transform="translate(36, 0)">
        <rect x="0" y="2" width="24" height="20" rx="4.5" fill="#0f172a" stroke="#f59e0b" stroke-width="2"/>
        <circle cx="12" cy="12" r="5.5" fill="#1e293b" stroke="#fbbf24" stroke-width="1.6"/>
        <circle cx="12" cy="12" r="2.5" fill="#38bdf8"/>
        <circle cx="19" cy="6.5" r="1.6" fill="#ef4444"/>
        <path d="M21 0 L25 4 M25 0 L21 4" stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M3 0 L7 4" stroke="#fbbf24" stroke-width="1.6" stroke-linecap="round"/>
      </g>
    ` : '';

    return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="slRimGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="60%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
        <radialGradient id="slRedGrad" cx="32%" cy="28%" r="72%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="35%" stop-color="#ef4444"/>
          <stop offset="85%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#991b1b"/>
        </radialGradient>
        <radialGradient id="slWhiteGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="75%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </radialGradient>
      </defs>
      <!-- Beveled outer rim -->
      <circle cx="32" cy="32" r="30" fill="url(#slRimGrad)"/>
      <!-- Saturated red speed circle -->
      <circle cx="32" cy="32" r="28" fill="url(#slRedGrad)"/>
      <!-- Crisp white inner core with subtle depth -->
      <circle cx="32" cy="32" r="22.5" fill="url(#slWhiteGrad)"/>
      <circle cx="32" cy="32" r="22.5" stroke="#cbd5e1" stroke-width="0.8" opacity="0.6"/>
      <!-- High contrast speed number -->
      <text x="32" y="${textY}" font-family="'Tektur', 'Inter', sans-serif" font-weight="900" font-size="${fontSize}" letter-spacing="${letterSpacing}" fill="#0f172a" text-anchor="middle">${num}</text>
      ${cameraAperture}
    </svg>`;
  }

  const EVENT_SVG_ICONS = {
    speeding: generateSpeedLimitSignSvg(80, false),

    speeding_camera: generateSpeedLimitSignSvg(90, true),

    red_signal: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rsGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9"/>
          <stop offset="60%" stop-color="#ef4444" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="rsRedBulb" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stop-color="#fca5a5"/>
          <stop offset="30%" stop-color="#ef4444"/>
          <stop offset="85%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </radialGradient>
        <linearGradient id="rsBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <!-- Outer halo from red light -->
      <circle cx="32" cy="18" r="16" fill="url(#rsGlow)"/>
      <!-- Traffic light housing -->
      <rect x="20" y="4" width="24" height="56" rx="8" fill="url(#rsBody)" stroke="#334155" stroke-width="2"/>
      <!-- Hood visors over lamps -->
      <path d="M19 14 C19 8 45 8 45 14" stroke="#475569" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M19 32 C19 26 45 26 45 32" stroke="#475569" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M19 50 C19 44 45 44 45 50" stroke="#475569" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <!-- Red light (ACTIVE) -->
      <circle cx="32" cy="18" r="7.5" fill="url(#rsRedBulb)" stroke="#f87171" stroke-width="1.5"/>
      <circle cx="30" cy="15.5" r="2.2" fill="#ffffff" opacity="0.85"/>
      <!-- Amber light (DARK) -->
      <circle cx="32" cy="36" r="6.5" fill="#2d2006" stroke="#78350f" stroke-width="1.5"/>
      <circle cx="32" cy="36" r="4.5" fill="#451a03" opacity="0.6"/>
      <!-- Green light (DARK) -->
      <circle cx="32" cy="52" r="6.5" fill="#052418" stroke="#065f46" stroke-width="1.5"/>
      <circle cx="32" cy="52" r="4.5" fill="#022c22" opacity="0.6"/>
    </svg>`,

    crash: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="crFlash" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#f59e0b"/>
          <stop offset="85%" stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#991b1b"/>
        </radialGradient>
        <linearGradient id="crMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>
      </defs>
      <!-- Sharp impact starburst -->
      <path d="M32 4 L37 18 L51 12 L42 24 L56 30 L42 36 L49 48 L35 41 L32 58 L29 41 L15 48 L22 36 L8 30 L22 24 L13 12 L27 18 Z" fill="url(#crFlash)" stroke="#fef08a" stroke-width="1.5"/>
      <!-- Inner impact core -->
      <path d="M32 14 L35 23 L44 19 L38 27 L47 31 L38 35 L42 43 L34 38 L32 47 L30 38 L22 43 L26 35 L17 31 L26 27 L20 19 L29 23 Z" fill="#ffffff" opacity="0.95"/>
      <!-- Crumpled vehicle body shards -->
      <path d="M10 44 L20 44 L25 38 L16 36 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
      <path d="M54 44 L44 44 L39 38 L48 36 Z" fill="url(#crMetal)" stroke="#334155" stroke-width="1"/>
      <!-- Sparks -->
      <circle cx="16" cy="16" r="1.8" fill="#fbbf24"/>
      <circle cx="48" cy="18" r="1.8" fill="#fbbf24"/>
      <circle cx="32" cy="6" r="1.5" fill="#fef08a"/>
    </svg>`,

    no_lights: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nlBeam" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#64748b" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#334155" stop-opacity="0.2"/>
        </linearGradient>
      </defs>
      <!-- Automotive projector headlight silhouette -->
      <path d="M14 20 C14 20 28 17 30 32 C28 47 14 44 14 44 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5"/>
      <path d="M22 26 C25 28 25 36 22 38" stroke="#cbd5e1" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Turned off disabled beam lines -->
      <line x1="36" y1="22" x2="50" y2="16" stroke="url(#nlBeam)" stroke-width="3" stroke-linecap="round"/>
      <line x1="38" y1="32" x2="52" y2="32" stroke="url(#nlBeam)" stroke-width="3" stroke-linecap="round"/>
      <line x1="36" y1="42" x2="50" y2="48" stroke="url(#nlBeam)" stroke-width="3" stroke-linecap="round"/>
      <!-- Heavy duty prohibition ring & diagonal bar -->
      <circle cx="32" cy="32" r="26" stroke="#ef4444" stroke-width="4.2" fill="none"/>
      <line x1="14" y1="14" x2="50" y2="50" stroke="#ef4444" stroke-width="4.2" stroke-linecap="round"/>
    </svg>`,

    avoid_sleeping: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tachoGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </radialGradient>
      </defs>
      <!-- Tachograph / clock dial -->
      <circle cx="30" cy="34" r="22" fill="url(#tachoGrad)" stroke="#38bdf8" stroke-width="2.5"/>
      <!-- Warning arc in red for 9h+ overtime -->
      <path d="M30 12 A22 22 0 0 1 52 34" stroke="#ef4444" stroke-width="3.5" fill="none"/>
      <!-- Clock ticks -->
      <line x1="30" y1="15" x2="30" y2="18" stroke="#94a3b8" stroke-width="2"/>
      <line x1="48" y1="34" x2="51" y2="34" stroke="#94a3b8" stroke-width="2"/>
      <line x1="30" y1="50" x2="30" y2="53" stroke="#94a3b8" stroke-width="2"/>
      <line x1="9" y1="34" x2="12" y2="34" stroke="#94a3b8" stroke-width="2"/>
      <!-- Clock hands pointing to overtime -->
      <circle cx="30" cy="34" r="3" fill="#f8fafc"/>
      <line x1="30" y1="34" x2="30" y2="20" stroke="#f8fafc" stroke-width="2.8" stroke-linecap="round"/>
      <line x1="30" y1="34" x2="43" y2="38" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Top stopwatch button -->
      <rect x="27" y="7" width="6" height="5" rx="1.5" fill="#38bdf8"/>
      <!-- Stylized floating luminous Zzz -->
      <text x="48" y="20" font-family="'Tektur', sans-serif" font-weight="900" font-size="16" fill="#f59e0b">Z</text>
      <text x="54" y="30" font-family="'Tektur', sans-serif" font-weight="900" font-size="12" fill="#fbbf24">z</text>
      <text x="58" y="39" font-family="'Tektur', sans-serif" font-weight="900" font-size="9" fill="#fde68a">z</text>
    </svg>`,

    wrong_way: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wwRed" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="35%" stop-color="#ef4444"/>
          <stop offset="85%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </radialGradient>
      </defs>
      <!-- No entry circle sign -->
      <circle cx="32" cy="32" r="28" fill="url(#wwRed)" stroke="#fee2e2" stroke-width="2"/>
      <!-- Thick horizontal white bar -->
      <rect x="11" y="26" width="42" height="12" rx="3" fill="#ffffff"/>
      <!-- Opposing arrow chevrons -->
      <path d="M32 8 L38 15 L26 15 Z" fill="#ffffff" opacity="0.9"/>
      <path d="M32 56 L26 49 L38 49 Z" fill="#ffffff" opacity="0.9"/>
    </svg>`,

    avoid_weighing: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Weight platform base -->
      <rect x="6" y="44" width="52" height="8" rx="2" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
      <rect x="14" y="52" width="8" height="5" fill="#475569"/>
      <rect x="42" y="52" width="8" height="5" fill="#475569"/>
      <!-- Truck silhouette over scales -->
      <path d="M10 42 L10 26 L30 26 L40 33 L48 33 L48 42 Z" fill="#f59e0b" stroke="#d97706" stroke-width="1.8"/>
      <circle cx="17" cy="42" r="4.5" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.8"/>
      <circle cx="41" cy="42" r="4.5" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.8"/>
      <!-- Warning beacon triangle -->
      <polygon points="32,7 44,25 20,25" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
      <text x="32" y="22" font-family="'Inter', sans-serif" font-weight="900" font-size="13" fill="#ffffff" text-anchor="middle">!</text>
    </svg>`,

    refuel: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rfBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <radialGradient id="rfDrop" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#6ee7b7"/>
          <stop offset="70%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#047857"/>
        </radialGradient>
      </defs>
      <!-- Dispenser body -->
      <rect x="8" y="10" width="30" height="46" rx="5" fill="url(#rfBody)" stroke="#10b981" stroke-width="2.5"/>
      <!-- Digital counter display -->
      <rect x="13" y="16" width="20" height="12" rx="2.5" fill="#064e3b" stroke="#34d399" stroke-width="1.2"/>
      <text x="23" y="25" font-family="'Tektur', sans-serif" font-weight="700" font-size="8" fill="#34d399" text-anchor="middle">GAS</text>
      <!-- Hose arching to right nozzle -->
      <path d="M38 20 C48 20 50 30 50 38 C50 45 46 47 46 42 L46 28 L52 25" stroke="#34d399" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Dispensing fuel droplet -->
      <path d="M23 35 C23 35 30 43 30 47 C30 50.8 26.8 54 23 54 C19.2 54 16 50.8 16 47 C16 43 23 35 23 35 Z" fill="url(#rfDrop)" stroke="#a7f3d0" stroke-width="1"/>
      <circle cx="21" cy="46" r="1.5" fill="#ffffff" opacity="0.8"/>
    </svg>`,

    tollgate: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tgCoin" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="70%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </radialGradient>
      </defs>
      <!-- Toll barrier post -->
      <rect x="8" y="22" width="12" height="34" rx="3" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="14" cy="28" r="3.5" fill="#10b981"/>
      <!-- Lifted striped boom barrier -->
      <path d="M14 28 L56 16" stroke="#ef4444" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M14 28 L56 16" stroke="#ffffff" stroke-width="5.5" stroke-dasharray="8 8" stroke-linecap="round"/>
      <!-- Electronic payment euro medallion -->
      <circle cx="42" cy="42" r="14" fill="url(#tgCoin)" stroke="#7dd3fc" stroke-width="2.2"/>
      <text x="42" y="49" font-family="'Tektur', sans-serif" font-weight="900" font-size="17" fill="#ffffff" text-anchor="middle">€</text>
      <!-- Radio wave transponder arcs -->
      <path d="M48 24 A22 22 0 0 1 54 30" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      <path d="M52 20 A28 28 0 0 1 60 27" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    </svg>`,

    ferry: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="frHull" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      <!-- Ship hull -->
      <path d="M6 38 L14 50 L50 50 L58 38 L44 38 L44 26 L34 26 L34 18 L28 18 L28 26 L16 26 L16 38 Z" fill="url(#frHull)" stroke="#fef3c7" stroke-width="1.8"/>
      <!-- Funnel & smoke -->
      <rect x="29" y="14" width="6" height="6" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
      <circle cx="32" cy="9" r="2.5" fill="#94a3b8" opacity="0.7"/>
      <circle cx="37" cy="6" r="3.2" fill="#94a3b8" opacity="0.5"/>
      <!-- Portholes -->
      <circle cx="20" cy="32" r="2" fill="#0f172a" stroke="#fbbf24" stroke-width="1"/>
      <circle cx="27" cy="32" r="2" fill="#0f172a" stroke="#fbbf24" stroke-width="1"/>
      <circle cx="34" cy="32" r="2" fill="#0f172a" stroke="#fbbf24" stroke-width="1"/>
      <!-- Sea wave swells -->
      <path d="M4 55 C9 52 14 52 19 55 C24 58 29 58 34 55 C39 52 44 52 49 55 C54 58 59 58 64 55" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
    </svg>`,

    train: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <!-- Tunnel arch portal background -->
      <path d="M10 52 L10 24 C10 12 20 6 32 6 C44 6 54 12 54 24 L54 52" stroke="#475569" stroke-width="2.5" fill="none"/>
      <!-- Locomotive body -->
      <rect x="14" y="12" width="36" height="38" rx="8" fill="url(#trBody)" stroke="#f59e0b" stroke-width="2.5"/>
      <!-- Windshield -->
      <rect x="20" y="18" width="24" height="13" rx="3.5" fill="#38bdf8" opacity="0.9" stroke="#0284c7" stroke-width="1"/>
      <path d="M22 20 L30 29" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
      <!-- Twin bright headlights -->
      <circle cx="21" cy="41" r="4" fill="#fef08a" stroke="#f59e0b" stroke-width="1.5"/>
      <circle cx="43" cy="41" r="4" fill="#fef08a" stroke="#f59e0b" stroke-width="1.5"/>
      <circle cx="32" cy="15" r="2.2" fill="#fef08a"/>
      <!-- Rails & cross-ties -->
      <line x1="8" y1="56" x2="56" y2="56" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
      <line x1="14" y1="52" x2="50" y2="52" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
      <line x1="18" y1="60" x2="46" y2="60" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
    </svg>`,

    job_delivered: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="jdShield" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#22c55e"/>
          <stop offset="60%" stop-color="#16a34a"/>
          <stop offset="100%" stop-color="#14532d"/>
        </radialGradient>
      </defs>
      <!-- Victory achievement shield -->
      <path d="M32 4 L54 13 L54 32 C54 46 44 55 32 60 C20 55 10 46 10 32 L10 13 Z" fill="url(#jdShield)" stroke="#86efac" stroke-width="2.5"/>
      <!-- Bold crisp checkmark -->
      <path d="M21 32 L29 40 L44 23" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Victory corner sparkle stars -->
      <circle cx="16" cy="18" r="1.5" fill="#fde047"/>
      <circle cx="48" cy="18" r="1.5" fill="#fde047"/>
    </svg>`,

    job_cancelled: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="jcShield" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ef4444"/>
          <stop offset="65%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </radialGradient>
      </defs>
      <!-- Cancellation shield -->
      <path d="M32 4 L54 13 L54 32 C54 46 44 55 32 60 C20 55 10 46 10 32 L10 13 Z" fill="url(#jcShield)" stroke="#fca5a5" stroke-width="2.5"/>
      <!-- Bold X cancellation cross -->
      <path d="M23 23 L41 41 M41 23 L23 41" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    </svg>`,

    generic_fine: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gfRed" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#991b1b"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#1e293b" stroke="url(#gfRed)" stroke-width="3.5"/>
      <polygon points="32,12 46,42 18,42" fill="url(#gfRed)" stroke="#ffffff" stroke-width="1.5"/>
      <text x="32" y="38" font-family="'Inter', sans-serif" font-weight="900" font-size="19" fill="#ffffff" text-anchor="middle">!</text>
    </svg>`,

    illegal_trailer: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="18" width="36" height="26" rx="3.5" fill="#1e293b" stroke="#f59e0b" stroke-width="2.2"/>
      <line x1="42" y1="31" x2="54" y2="31" stroke="#94a3b8" stroke-width="4.5"/>
      <circle cx="16" cy="46" r="5" fill="#0f172a" stroke="#cbd5e1" stroke-width="2.2"/>
      <circle cx="30" cy="46" r="5" fill="#0f172a" stroke="#cbd5e1" stroke-width="2.2"/>
      <!-- Prohibition circle -->
      <circle cx="46" cy="22" r="14" fill="#ef4444" stroke="#ffffff" stroke-width="2.5"/>
      <line x1="36" y1="32" x2="56" y2="12" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>
    </svg>`,

    damaged_vehicle: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Truck cabin -->
      <rect x="8" y="16" width="34" height="30" rx="4" fill="#1e293b" stroke="#ef4444" stroke-width="2.5"/>
      <!-- Cracked windshield -->
      <path d="M12 20 L26 34 M26 20 L12 34" stroke="#fca5a5" stroke-width="2" stroke-linecap="round"/>
      <circle cx="17" cy="48" r="4.5" fill="#0f172a" stroke="#ef4444" stroke-width="2"/>
      <circle cx="33" cy="48" r="4.5" fill="#0f172a" stroke="#ef4444" stroke-width="2"/>
      <!-- Radiator steam -->
      <path d="M38 16 C42 10 48 10 50 16 C53 12 57 16 55 22 C59 26 55 33 48 31" fill="#94a3b8" opacity="0.7"/>
      <!-- Alert triangle -->
      <polygon points="48,36 59,54 37,54" fill="#f59e0b" stroke="#ffffff" stroke-width="1.8"/>
      <text x="48" y="51" font-family="'Inter', sans-serif" font-weight="900" font-size="12" fill="#000000" text-anchor="middle">!</text>
    </svg>`,

    illegal_border_crossing: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="26" width="9" height="28" rx="2" fill="#334155" stroke="#64748b" stroke-width="2"/>
      <rect x="49" y="26" width="9" height="28" rx="2" fill="#334155" stroke="#64748b" stroke-width="2"/>
      <path d="M10 32 L54 32" stroke="#ef4444" stroke-width="7" stroke-linecap="round"/>
      <path d="M10 32 L54 32" stroke="#ffffff" stroke-width="7" stroke-dasharray="7 7" stroke-linecap="round"/>
      <circle cx="32" cy="15" r="11" fill="#dc2626" stroke="#ffffff" stroke-width="2.2"/>
      <rect x="25" y="13" width="14" height="4.5" rx="1.5" fill="#ffffff"/>
    </svg>`,

    hard_shoulder_violation: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="8" width="52" height="48" rx="7" fill="#1e293b" stroke="#475569" stroke-width="2.5"/>
      <line x1="22" y1="8" x2="22" y2="56" stroke="#ffffff" stroke-width="3" stroke-dasharray="6 6"/>
      <line x1="42" y1="8" x2="42" y2="56" stroke="#f59e0b" stroke-width="3.5"/>
      <path d="M14 44 L14 30 L19 23 L24 23 L24 44 Z" fill="#38bdf8"/>
      <path d="M24 30 C29 30 38 27 43 20" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 4"/>
      <polygon points="43,15 49,22 40,23" fill="#ef4444"/>
    </svg>`,

    cargo_damage: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cdCrate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#92400e"/>
          <stop offset="100%" stop-color="#451a03"/>
        </linearGradient>
      </defs>
      <!-- Freight cargo container -->
      <rect x="8" y="14" width="48" height="42" rx="4" fill="url(#cdCrate)" stroke="#d97706" stroke-width="2.5"/>
      <!-- Ribs -->
      <line x1="8" y1="26" x2="56" y2="26" stroke="#b45309" stroke-width="2"/>
      <line x1="32" y1="26" x2="32" y2="56" stroke="#b45309" stroke-width="2"/>
      <!-- Jagged fracture crack -->
      <path d="M24 14 L33 28 L26 38 L38 52" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Warning badge -->
      <polygon points="46,28 58,50 34,50" fill="#ef4444" stroke="#ffffff" stroke-width="1.8"/>
      <text x="46" y="47" font-family="'Inter', sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle">!</text>
    </svg>`,

    service: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="svGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="70%" stop-color="#059669"/>
          <stop offset="100%" stop-color="#064e3b"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#svGrad)" stroke="#34d399" stroke-width="2.5"/>
      <!-- Chrome wrench crossing gear -->
      <path d="M20 44 L36 28 M31 23 L41 33 M39 18 C44 13 51 15 53 18 C55 20 57 27 53 31 L46 24" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="22" cy="42" r="4.5" fill="#34d399"/>
      <!-- Precision gear teeth markers -->
      <path d="M32 10 L34 15 M32 54 L34 49 M10 32 L15 34 M54 32 L49 34" stroke="#a7f3d0" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

    low_fuel: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="30" height="46" rx="5" fill="#1e293b" stroke="#f59e0b" stroke-width="2.5"/>
      <rect x="13" y="16" width="20" height="12" rx="2.5" fill="#451a03" stroke="#f59e0b" stroke-width="1.2"/>
      <text x="23" y="25" font-family="'Tektur', sans-serif" font-weight="700" font-size="7.5" fill="#fbbf24" text-anchor="middle">LOW</text>
      <path d="M38 20 C48 20 50 30 50 38 C50 45 46 47 46 42 L46 28 L52 25" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" fill="none"/>
      <polygon points="23,34 31,48 15,48" fill="#ef4444"/>
      <text x="23" y="46" font-family="'Inter', sans-serif" font-weight="900" font-size="11" fill="#ffffff" text-anchor="middle">!</text>
    </svg>`,

    bus_stop: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#14b8a6"/>
          <stop offset="100%" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <!-- Bus coach silhouette -->
      <rect x="8" y="14" width="48" height="32" rx="6" fill="#134e4a" stroke="url(#bsGrad)" stroke-width="2.5"/>
      <!-- Windows -->
      <rect x="13" y="19" width="12" height="11" rx="2.5" fill="#2dd4bf" opacity="0.85"/>
      <rect x="27" y="19" width="12" height="11" rx="2.5" fill="#2dd4bf" opacity="0.85"/>
      <!-- Entrance door -->
      <rect x="41" y="19" width="10" height="21" rx="1.5" fill="#0f766e" stroke="#5eead4" stroke-width="1.2"/>
      <!-- Wheels -->
      <circle cx="18" cy="48" r="5.5" fill="#0f172a" stroke="#2dd4bf" stroke-width="2.2"/>
      <circle cx="44" cy="48" r="5.5" fill="#0f172a" stroke="#2dd4bf" stroke-width="2.2"/>
      <!-- Platform stop curb -->
      <line x1="4" y1="56" x2="60" y2="56" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,

    bus_comfort: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sadEmojiGrad64" cx="35%" cy="32%" r="65%">
          <stop offset="0%" stop-color="#fb923c"/>
          <stop offset="70%" stop-color="#ea580c"/>
          <stop offset="100%" stop-color="#b91c1c"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#sadEmojiGrad64)" stroke="#ef4444" stroke-width="2.8"/>
      <ellipse cx="22" cy="27" rx="3.2" ry="4.4" fill="#18181b"/>
      <ellipse cx="42" cy="27" rx="3.2" ry="4.4" fill="#18181b"/>
      <circle cx="21" cy="25" r="1.3" fill="#ffffff"/>
      <circle cx="41" cy="25" r="1.3" fill="#ffffff"/>
      <!-- Sad eyebrows slanted up in center -->
      <path d="M16 20 Q22 15 29 20" stroke="#450a0a" stroke-width="2.8" stroke-linecap="round" fill="none"/>
      <path d="M48 20 Q42 15 35 20" stroke="#450a0a" stroke-width="2.8" stroke-linecap="round" fill="none"/>
      <!-- Downturned sad mouth -->
      <path d="M21 47 Q32 36 43 47" stroke="#450a0a" stroke-width="3.6" stroke-linecap="round" fill="none"/>
      <!-- Teardrop -->
      <path d="M46 32 C46 32 42.5 38 42.5 41 C42.5 43.5 44.2 45 46.5 45 C48.8 45 50.5 43.5 50.5 41 C50.5 38 46 32 46 32 Z" fill="#38bdf8"/>
      <circle cx="45.5" cy="39.5" r="1" fill="#ffffff"/>
    </svg>`,

    bus_comfort_up: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="happyEmojiGrad64" cx="35%" cy="32%" r="65%">
          <stop offset="0%" stop-color="#6ee7b7"/>
          <stop offset="68%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#047857"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#happyEmojiGrad64)" stroke="#34d399" stroke-width="2.8"/>
      <!-- Squinting happy eyes arcs -->
      <path d="M18 26 Q24 19 30 26" stroke="#064e3b" stroke-width="3.4" stroke-linecap="round" fill="none"/>
      <path d="M34 26 Q40 19 46 26" stroke="#064e3b" stroke-width="3.4" stroke-linecap="round" fill="none"/>
      <!-- Cheerful eyebrows -->
      <path d="M17 18 Q23 13 30 17" stroke="#064e3b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M34 17 Q41 13 47 18" stroke="#064e3b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Wide smiling mouth with teeth -->
      <path d="M19 35 Q32 54 45 35 Z" fill="#064e3b"/>
      <path d="M21 35 Q32 44 43 35 Z" fill="#ffffff"/>
      <!-- Cheeks blush -->
      <ellipse cx="16" cy="32" rx="4" ry="2.4" fill="#fb7185" opacity="0.45"/>
      <ellipse cx="48" cy="32" rx="4" ry="2.4" fill="#fb7185" opacity="0.45"/>
      <!-- Sparkle star -->
      <path d="M50 7 L51.5 11 L55.5 12.5 L51.5 14 L50 18 L48.5 14 L44.5 12.5 L48.5 11 Z" fill="#fbbf24"/>
    </svg>`,

    chat_honk: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hnkTrumpet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc"/>
          <stop offset="100%" stop-color="#7e22ce"/>
        </linearGradient>
      </defs>
      <!-- Dual trumpet air horns -->
      <path d="M8 24 L26 24 L42 13 L42 37 L26 26 L8 26 Z" fill="url(#hnkTrumpet)" stroke="#e9d5ff" stroke-width="2"/>
      <path d="M8 36 L26 36 L42 27 L42 49 L26 38 L8 38 Z" fill="#9333ea" stroke="#e9d5ff" stroke-width="2"/>
      <!-- Dynamic sound pressure shockwaves -->
      <path d="M46 18 C51 23 51 41 46 46" stroke="#e9d5ff" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M52 12 C59 19 59 45 52 52" stroke="#f3e8ff" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,

    chat_cb: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Mic body -->
      <rect x="18" y="10" width="28" height="34" rx="11" fill="#1e293b" stroke="#eab308" stroke-width="2.8"/>
      <circle cx="32" cy="22" r="7" fill="#0f172a" stroke="#ca8a04" stroke-width="1.2"/>
      <circle cx="32" cy="22" r="2.5" fill="#facc15"/>
      <!-- PTT switch on left -->
      <rect x="13" y="19" width="5" height="10" rx="2.5" fill="#eab308"/>
      <!-- Coiled wire -->
      <path d="M32 44 C32 50 27 52 32 56 C37 60 32 63 32 63" stroke="#facc15" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    </svg>`,

    chat_route: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="48" height="48" rx="10" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2.8"/>
      <!-- GPS route curve with waypoints -->
      <path d="M18 46 L27 32 L37 38 L46 20" stroke="#7dd3fc" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <polygon points="46,15 51,24 42,22" fill="#38bdf8"/>
      <circle cx="18" cy="46" r="3.5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>
    </svg>`,

    chat_stats: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="8" width="52" height="48" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5"/>
      <!-- Columns -->
      <line x1="16" y1="46" x2="16" y2="34" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="27" y1="46" x2="27" y2="25" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="38" y1="46" x2="38" y2="18" stroke="#4ade80" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="49" y1="46" x2="49" y2="30" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
      <polygon points="32,7 34,12 40,12 35,15 37,20 32,17 27,20 29,15 24,12 30,12" fill="#facc15"/>
    </svg>`,

    chat_truck: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="8" width="36" height="42" rx="5" fill="#1e293b" stroke="#38bdf8" stroke-width="2.8"/>
      <!-- Windshield -->
      <rect x="18" y="13" width="28" height="14" rx="2.5" fill="#0284c7" opacity="0.85"/>
      <!-- Main front grille -->
      <rect x="20" y="32" width="24" height="12" rx="1.5" fill="#0f172a" stroke="#64748b" stroke-width="1.2"/>
      <!-- Headlights -->
      <circle cx="18" cy="44" r="3" fill="#fef08a"/>
      <circle cx="46" cy="44" r="3" fill="#fef08a"/>
      <line x1="10" y1="54" x2="54" y2="54" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>
    </svg>`,

    chat_driver: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Driver shield badge -->
      <path d="M32 6 L52 13 L52 32 C52 44 43 53 32 58 C21 53 12 44 12 32 L12 13 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="2.8"/>
      <!-- Driver head & body -->
      <circle cx="32" cy="25" r="7" fill="#38bdf8"/>
      <path d="M20 42 C20 36 25 33 32 33 C39 33 44 36 44 42" fill="#38bdf8"/>
      <polygon points="32,40 34,44 38,44 35,46 36,50 32,48 28,50 29,46 26,44 30,44" fill="#facc15"/>
    </svg>`,

    update: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="updGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#22c55e" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="updBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f2918"/>
          <stop offset="100%" stop-color="#05140b"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#updBg)" stroke="#22c55e" stroke-width="2.6"/>
      <circle cx="32" cy="32" r="23" stroke="#16a34a" stroke-width="1.2" stroke-dasharray="3 3"/>
      <circle cx="32" cy="32" r="20" fill="url(#updGlow)"/>
      <!-- Pip-Boy Vault-Tec Antenna / Arrow -->
      <path d="M32 14 V38" stroke="#4ade80" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M22 28 L32 38 L42 28" stroke="#4ade80" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="18" y1="46" x2="46" y2="46" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/>
      <circle cx="32" cy="46" r="2.2" fill="#86efac"/>
    </svg>`
  };

  const TelemetrySoundEngine = (() => {
    let ctx = null;

    function getAudioContext() {
      if (!ctx) {
        const AudioCtxClass = global.AudioContext || global.webkitAudioContext;
        if (AudioCtxClass) {
          ctx = new AudioCtxClass();
        }
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      return ctx;
    }

    function createNoiseBuffer(c, durationSec) {
      const bufferSize = Math.max(1, Math.floor(c.sampleRate * durationSec));
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      return buffer;
    }

    // 1. Камера скорости: реалистичный механический щелчок затвора зеркального фотоаппарата (без писка)
    function playSpeeding(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.9, t0);
      master.connect(c.destination);

      const noise = createNoiseBuffer(c, 0.08);

      // Первый импульс затвора (18 мс)
      const src1 = c.createBufferSource();
      src1.buffer = noise;
      const bpf1 = c.createBiquadFilter();
      bpf1.type = 'bandpass';
      bpf1.frequency.setValueAtTime(1800, t0);
      bpf1.Q.setValueAtTime(2.2, t0);
      const g1 = c.createGain();
      g1.gain.setValueAtTime(0.85, t0);
      g1.gain.exponentialRampToValueAtTime(0.001, t0 + 0.02);
      src1.connect(bpf1);
      bpf1.connect(g1);
      g1.connect(master);
      src1.start(t0);

      // Шелест шторок затвора
      const srcFlutter = c.createBufferSource();
      srcFlutter.buffer = noise;
      const lpfFlutter = c.createBiquadFilter();
      lpfFlutter.type = 'lowpass';
      lpfFlutter.frequency.setValueAtTime(800, t0);
      const gFlutter = c.createGain();
      gFlutter.gain.setValueAtTime(0.001, t0);
      gFlutter.gain.linearRampToValueAtTime(0.18, t0 + 0.012);
      gFlutter.gain.exponentialRampToValueAtTime(0.001, t0 + 0.065);
      srcFlutter.connect(lpfFlutter);
      lpfFlutter.connect(gFlutter);
      gFlutter.connect(master);
      srcFlutter.start(t0);

      // Второй импульс затвора (через 35 мс)
      const tClick2 = t0 + 0.035;
      const src2 = c.createBufferSource();
      src2.buffer = noise;
      const bpf2 = c.createBiquadFilter();
      bpf2.type = 'bandpass';
      bpf2.frequency.setValueAtTime(1400, tClick2);
      bpf2.Q.setValueAtTime(2.0, tClick2);
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0.9, tClick2);
      g2.gain.exponentialRampToValueAtTime(0.001, tClick2 + 0.02);
      src2.connect(bpf2);
      bpf2.connect(g2);
      g2.connect(master);
      src2.start(tClick2);
    }

    // 2. Проезд на красный: узнаваемый строгий двухтональный сигнал G5 -> D5
    function playRedSignal(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.8, t0);
      master.connect(c.destination);

      [
        { f: 783.99, start: t0, dur: 0.09 },
        { f: 587.33, start: t0 + 0.095, dur: 0.16 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);

        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1400, note.start);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.55, note.start + 0.006);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);

        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 3. ДТП / Авария: реалистичный низкий удар (110->38 Гц) + металлический шорох + двойной зуммер
    function playCrash(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.9, t0);
      master.connect(c.destination);

      // Низкий саб-удар кузова
      const oscThump = c.createOscillator();
      oscThump.type = 'sine';
      oscThump.frequency.setValueAtTime(110, t0);
      oscThump.frequency.exponentialRampToValueAtTime(38, t0 + 0.28);
      const gThump = c.createGain();
      gThump.gain.setValueAtTime(0.85, t0);
      gThump.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
      oscThump.connect(gThump);
      gThump.connect(master);
      oscThump.start(t0);
      oscThump.stop(t0 + 0.29);

      // Металлический шорох деформации
      const noise = createNoiseBuffer(c, 0.14);
      const srcNoise = c.createBufferSource();
      srcNoise.buffer = noise;
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.setValueAtTime(850, t0);
      bpf.Q.setValueAtTime(1.5, t0);
      const gNoise = c.createGain();
      gNoise.gain.setValueAtTime(0.35, t0);
      gNoise.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);
      srcNoise.connect(bpf);
      bpf.connect(gNoise);
      gNoise.connect(master);
      srcNoise.start(t0);

      // Двойной мягкий тон аварийки
      [t0 + 0.28, t0 + 0.42].forEach((tChime) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, tChime);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1500, tChime);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, tChime);
        g.gain.linearRampToValueAtTime(0.3, tChime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, tChime + 0.09);
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start(tChime);
        osc.stop(tChime + 0.10);
      });
    }

    // 4. Выключенные фары: мягкий приборный тон Scania NextGen (A4 -> C#5)
    function playNoLights(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.75, t0);
      master.connect(c.destination);

      [
        { f: 440.00, start: t0, dur: 0.12 },
        { f: 554.37, start: t0 + 0.11, dur: 0.24 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, note.start);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1600, note.start);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.5, note.start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 5. Тахограф / Режим отдыха: современный двойной тон (E5 -> B5)
    function playTachograph(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.75, t0);
      master.connect(c.destination);

      [
        { f: 659.25, start: t0, dur: 0.10 },
        { f: 987.77, start: t0 + 0.10, dur: 0.26 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1800, note.start);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.48, note.start + 0.006);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 6. Встречная полоса: строгий приборный алерт (D5 -> Bb4)
    function playWrongWay(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.8, t0);
      master.connect(c.destination);

      [
        { f: 587.33, start: t0, dur: 0.12 },
        { f: 466.16, start: t0 + 0.11, dur: 0.26 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, note.start);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1200, note.start);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.45, note.start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 7. Общий штраф / Предупреждение: гармоничный приборный перезвон (F5 -> A5 -> C6)
    function playWarningChime(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.75, t0);
      master.connect(c.destination);

      [
        { f: 698.46, start: t0, dur: 0.08 },
        { f: 880.00, start: t0 + 0.08, dur: 0.08 },
        { f: 1046.50, start: t0 + 0.16, dur: 0.22 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1800, note.start);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.48, note.start + 0.006);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 8. Платная дорога: современный кристальный сигнал оплаты (E5 -> B5, Apple Pay стиль)
    function playTollgate(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.85, t0);
      master.connect(c.destination);

      [
        { f: 659.25, start: t0, dur: 0.075 },
        { f: 987.77, start: t0 + 0.07, dur: 0.20 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);

        const oscHarm = c.createOscillator();
        oscHarm.type = 'sine';
        oscHarm.frequency.setValueAtTime(note.f * 2, note.start);
        const gHarm = c.createGain();
        gHarm.gain.setValueAtTime(0.07, note.start);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.55, note.start + 0.003);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);

        osc.connect(g);
        oscHarm.connect(gHarm);
        gHarm.connect(g);
        g.connect(master);

        osc.start(note.start);
        oscHarm.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
        oscHarm.stop(note.start + note.dur + 0.01);
      });
    }

    // 9. Дозаправка: тёплый перезвон электропиано / маримбы (C5 -> E5 -> G5)
    function playRefuel(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.8, t0);
      master.connect(c.destination);

      [
        { f: 523.25, start: t0, dur: 0.12 },
        { f: 659.25, start: t0 + 0.09, dur: 0.12 },
        { f: 783.99, start: t0 + 0.18, dur: 0.35 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);

        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1600, note.start);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.52, note.start + 0.004);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);

        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 10. Морской паром: глубокий реалистичный басовый гудок (98 Гц + 147 Гц, фильтр 280 Гц, атака 0.15s)
    function playFerry(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.9, t0);
      master.connect(c.destination);

      const dur = 0.95;
      [98.0, 147.0].forEach((f) => {
        const osc = c.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t0);

        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(280, t0);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, t0);
        g.gain.linearRampToValueAtTime(0.48, t0 + 0.15);
        g.gain.setValueAtTime(0.48, t0 + dur - 0.35);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);

        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      });
    }

    // 11. Поезд / Евротоннель: реалистичный аккорд тепловозного тифона вдали (фильтр 450 Гц)
    function playTrain(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.85, t0);
      master.connect(c.destination);

      const dur = 0.52;
      [311.13, 369.99, 466.16].forEach((f) => {
        const osc = c.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t0);

        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(450, t0);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, t0);
        g.gain.linearRampToValueAtTime(0.34, t0 + 0.08);
        g.gain.setValueAtTime(0.34, t0 + dur - 0.10);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);

        osc.start(t0);
        osc.stop(t0 + dur + 0.01);
      });
    }

    // 12. Сдача рейса: бархатный мажорный аккорд завершения контракта (C5 - E5 - G5 - C6)
    function playJobDelivered(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.85, t0);
      master.connect(c.destination);

      [
        { f: 523.25, start: t0, dur: 0.18 },
        { f: 659.25, start: t0 + 0.075, dur: 0.20 },
        { f: 783.99, start: t0 + 0.150, dur: 0.24 },
        { f: 1046.50, start: t0 + 0.225, dur: 0.55 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);

        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(2200, note.start);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.5, note.start + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);

        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 13. Отмена контракта: мягкий двухнотный нисходящий тон (A4 -> E4, без скрежета)
    function playJobCancelled(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.75, t0);
      master.connect(c.destination);

      [
        { f: 440.00, start: t0, dur: 0.14 },
        { f: 329.63, start: t0 + 0.12, dur: 0.32 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);

        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1200, note.start);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.48, note.start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);

        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 14. Рост комфорта пассажиров: светлый двухтональный колокольчик (F5 -> A5)
    function playBusComfortUp(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.75, t0);
      master.connect(c.destination);

      [
        { f: 698.46, start: t0, dur: 0.12 },
        { f: 880.00, start: t0 + 0.10, dur: 0.28 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);

        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(2000, note.start);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.5, note.start + 0.006);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);

        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 15. Падение комфорта: деликатный салонный нисходящий тон (E5 -> C5)
    function playBusComfortWarn(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.75, t0);
      master.connect(c.destination);

      [
        { f: 659.25, start: t0, dur: 0.13 },
        { f: 523.25, start: t0 + 0.11, dur: 0.28 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);

        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1400, note.start);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.46, note.start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);

        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 16. Остановка автобуса: пневматика дверей (шум 900 Гц) + Ding-Dong (G5 -> E5)
    function playBusDoors(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.8, t0);
      master.connect(c.destination);

      // Пневматический сброс давления дверей
      const dur = 0.35;
      const noise = createNoiseBuffer(c, dur);
      const srcNoise = c.createBufferSource();
      srcNoise.buffer = noise;
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.setValueAtTime(900, t0);
      bpf.Q.setValueAtTime(1.8, t0);
      const gNoise = c.createGain();
      gNoise.gain.setValueAtTime(0.001, t0);
      gNoise.gain.linearRampToValueAtTime(0.32, t0 + 0.05);
      gNoise.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      srcNoise.connect(bpf);
      bpf.connect(gNoise);
      gNoise.connect(master);
      srcNoise.start(t0);

      // Салонный двухтональный звонок Ding-Dong
      [
        { f: 783.99, start: t0 + 0.18, dur: 0.22 },
        { f: 659.25, start: t0 + 0.34, dur: 0.45 }
      ].forEach((bell) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(bell.f, bell.start);

        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1800, bell.start);

        const g = c.createGain();
        g.gain.setValueAtTime(0.001, bell.start);
        g.gain.linearRampToValueAtTime(0.5, bell.start + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, bell.start + bell.dur);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);

        osc.start(bell.start);
        osc.stop(bell.start + bell.dur + 0.01);
      });
    }

    // 17. Повреждение груза: глухой удар + треск + мягкий сигнал
    function playCargoDamage(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.85, t0);
      master.connect(c.destination);

      const oscThump = c.createOscillator();
      oscThump.type = 'sine';
      oscThump.frequency.setValueAtTime(95, t0);
      oscThump.frequency.exponentialRampToValueAtTime(32, t0 + 0.22);
      const gThump = c.createGain();
      gThump.gain.setValueAtTime(0.8, t0);
      gThump.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
      oscThump.connect(gThump);
      gThump.connect(master);
      oscThump.start(t0);
      oscThump.stop(t0 + 0.25);

      const noise = createNoiseBuffer(c, 0.10);
      const src = c.createBufferSource();
      src.buffer = noise;
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.setValueAtTime(650, t0);
      bpf.Q.setValueAtTime(1.6, t0);
      const gNoise = c.createGain();
      gNoise.gain.setValueAtTime(0.3, t0);
      gNoise.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
      src.connect(bpf);
      bpf.connect(gNoise);
      gNoise.connect(master);
      src.start(t0);

      const oscBeep = c.createOscillator();
      oscBeep.type = 'sine';
      oscBeep.frequency.setValueAtTime(1200, t0 + 0.12);
      const lpf = c.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(1500, t0 + 0.12);
      const gBeep = c.createGain();
      gBeep.gain.setValueAtTime(0.001, t0 + 0.12);
      gBeep.gain.linearRampToValueAtTime(0.35, t0 + 0.125);
      gBeep.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      oscBeep.connect(lpf);
      lpf.connect(gBeep);
      gBeep.connect(master);
      oscBeep.start(t0 + 0.12);
      oscBeep.stop(t0 + 0.23);
    }

    // 18. Техобслуживание: щелчки пневмоинструмента + благородный аккорд (D5 -> F#5)
    function playService(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.8, t0);
      master.connect(c.destination);

      const noise = createNoiseBuffer(c, 0.025);
      for (let i = 0; i < 3; i++) {
        const nt = t0 + i * 0.06;
        const src = c.createBufferSource();
        src.buffer = noise;
        const bpf = c.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(1200, nt);
        bpf.Q.setValueAtTime(2.2, nt);
        const g = c.createGain();
        g.gain.setValueAtTime(0.65, nt);
        g.gain.exponentialRampToValueAtTime(0.001, nt + 0.04);
        src.connect(bpf);
        bpf.connect(g);
        g.connect(master);
        src.start(nt);
      }

      [
        { f: 587.33, start: t0 + 0.22, dur: 0.14 },
        { f: 739.99, start: t0 + 0.32, dur: 0.28 }
      ].forEach((note) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, note.start);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1800, note.start);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, note.start);
        g.gain.linearRampToValueAtTime(0.48, note.start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start(note.start);
        osc.stop(note.start + note.dur + 0.01);
      });
    }

    // 19. Резерв топлива: ненавязчивый двойной тон приборной панели (D5)
    function playLowFuel(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.75, t0);
      master.connect(c.destination);

      [t0, t0 + 0.16].forEach((pt) => {
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, pt);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1200, pt);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, pt);
        g.gain.linearRampToValueAtTime(0.5, pt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, pt + 0.12);
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start(pt);
        osc.stop(pt + 0.13);
      });
    }

    // 20. Пневмогудок: реалистичный низкий двухрожковый гудок тягача (220 Гц + 277.18 Гц)
    function playTruckPneumoHorn(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.88, t0);
      master.connect(c.destination);

      const dur = 0.55;
      [220.00, 277.18].forEach((f) => {
        const osc = c.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t0);
        const lpf = c.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(750, t0);
        const g = c.createGain();
        g.gain.setValueAtTime(0.001, t0);
        g.gain.linearRampToValueAtTime(0.42, t0 + 0.04);
        g.gain.setValueAtTime(0.42, t0 + dur - 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(lpf);
        lpf.connect(g);
        g.connect(master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.01);
      });
    }

    // 21. CB-Рация: мягкий шум эфира + роджер-бип
    function playCBRadio(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.75, t0);
      master.connect(c.destination);

      const noise = createNoiseBuffer(c, 0.045);
      const src = c.createBufferSource();
      src.buffer = noise;
      const bpf = c.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.setValueAtTime(1100, t0);
      const gNoise = c.createGain();
      gNoise.gain.setValueAtTime(0.5, t0);
      gNoise.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
      src.connect(bpf);
      bpf.connect(gNoise);
      gNoise.connect(master);
      src.start(t0);

      const tBeep = t0 + 0.065;
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.50, tBeep);
      const gBeep = c.createGain();
      gBeep.gain.setValueAtTime(0.001, tBeep);
      gBeep.gain.linearRampToValueAtTime(0.4, tBeep + 0.004);
      gBeep.gain.exponentialRampToValueAtTime(0.001, tBeep + 0.07);
      osc.connect(gBeep);
      gBeep.connect(master);
      osc.start(tBeep);
      osc.stop(tBeep + 0.08);
    }

    // 16. Включение CRT-монитора (Pip-Boy 3000 Power-On: щелчок питания + свист кинескопа 15.6 кГц + размагничивание)
    function playCrtPowerOn(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.85, t0);
      master.connect(c.destination);

      // Щелчок тумблера питания
      const clickOsc = c.createOscillator();
      const clickGain = c.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(140, t0);
      clickOsc.frequency.exponentialRampToValueAtTime(35, t0 + 0.04);
      clickGain.gain.setValueAtTime(0.7, t0);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
      clickOsc.connect(clickGain);
      clickGain.connect(master);
      clickOsc.start(t0);
      clickOsc.stop(t0 + 0.045);

      // Высоковольтный свист строчного трансформатора ТДКС (15.6 kHz)
      const flyback = c.createOscillator();
      const flybackGain = c.createGain();
      flyback.type = 'sine';
      flyback.frequency.setValueAtTime(3500, t0 + 0.02);
      flyback.frequency.exponentialRampToValueAtTime(15625, t0 + 0.35);
      flybackGain.gain.setValueAtTime(0.001, t0);
      flybackGain.gain.linearRampToValueAtTime(0.25, t0 + 0.25);
      flybackGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
      flyback.connect(flybackGain);
      flybackGain.connect(master);
      flyback.start(t0 + 0.02);
      flyback.stop(t0 + 0.58);

      // Низкочастотный импульс размагничивающей петли
      const degauss = c.createOscillator();
      const degaussGain = c.createGain();
      degauss.type = 'sine';
      degauss.frequency.setValueAtTime(110, t0);
      degauss.frequency.exponentialRampToValueAtTime(45, t0 + 0.32);
      degaussGain.gain.setValueAtTime(0.45, t0);
      degaussGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
      degauss.connect(degaussGain);
      degaussGain.connect(master);
      degauss.start(t0);
      degauss.stop(t0 + 0.36);
    }

    // 17. Выключение CRT-монитора (Pip-Boy 3000 Power-Off: угасающий свист луча и схлопывание)
    function playCrtPowerOff(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.01;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.85, t0);
      master.connect(c.destination);

      // Угасающий свист разряда кинескопа
      const discharge = c.createOscillator();
      const dischargeGain = c.createGain();
      discharge.type = 'sine';
      discharge.frequency.setValueAtTime(15625, t0);
      discharge.frequency.exponentialRampToValueAtTime(1200, t0 + 0.38);
      dischargeGain.gain.setValueAtTime(0.2, t0);
      dischargeGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
      discharge.connect(dischargeGain);
      dischargeGain.connect(master);
      discharge.start(t0);
      discharge.stop(t0 + 0.42);

      // Щелчок схлопывания луча
      const snap = c.createOscillator();
      const snapGain = c.createGain();
      snap.type = 'square';
      snap.frequency.setValueAtTime(220, t0 + 0.35);
      snap.frequency.exponentialRampToValueAtTime(40, t0 + 0.39);
      snapGain.gain.setValueAtTime(0.4, t0 + 0.35);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
      snap.connect(snapGain);
      snapGain.connect(master);
      snap.start(t0 + 0.35);
      snap.stop(t0 + 0.41);
    }

    // 18. Механический щелчок терминала / телетайпа
    function playTerminalTick(vol) {
      const c = getAudioContext();
      if (!c) return;
      const t0 = c.currentTime + 0.002;
      const master = c.createGain();
      master.gain.setValueAtTime(vol * 0.35, t0);
      master.connect(c.destination);

      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800 + Math.random() * 400, t0);
      osc.frequency.exponentialRampToValueAtTime(600, t0 + 0.012);
      gain.gain.setValueAtTime(0.6, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.015);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + 0.018);
    }

    return {
      playSpeeding,
      playRedSignal,
      playCrash,
      playNoLights,
      playTachograph,
      playWrongWay,
      playWarningChime,
      playRefuel,
      playTollgate,
      playFerry,
      playTrain,
      playJobDelivered,
      playJobCancelled,
      playCargoDamage,
      playService,
      playLowFuel,
      playBusDoors,
      playBusComfortWarn,
      playBusComfortUp,
      playTruckPneumoHorn,
      playCBRadio,
      playCrtPowerOn,
      playCrtPowerOff,
      playTerminalTick
    };
  })();

  function playEventAudio(type, offence) {
    const etsCfg = config.ets2 || {};
    if (etsCfg.eventSoundEnabled === false) return;
    const vol = typeof etsCfg.eventSoundVolume === 'number'
      ? Math.max(0, Math.min(1, etsCfg.eventSoundVolume))
      : 0.65;
    if (vol <= 0) return;

    if (type === 'update') {
      TelemetrySoundEngine.playCrtPowerOn(vol);
      return;
    }

    const soundKey = offence || type;
    const candidatePath = `./assets/sounds/${soundKey}.mp3`;

    try {
      const audio = new Audio(candidatePath);
      audio.volume = vol;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          synthesizeEventSound(type, offence, vol);
        });
      }
    } catch (_) {
      synthesizeEventSound(type, offence, vol);
    }
  }

  function synthesizeEventSound(type, offence, vol) {
    if (type === 'fine') {
      if (offence && offence.startsWith('speeding')) {
        TelemetrySoundEngine.playSpeeding(vol);
        return;
      }
      switch (offence) {
        case 'red_signal':
          TelemetrySoundEngine.playRedSignal(vol);
          break;
        case 'crash':
          TelemetrySoundEngine.playCrash(vol);
          break;
        case 'no_lights':
          TelemetrySoundEngine.playNoLights(vol);
          break;
        case 'avoid_sleeping':
          TelemetrySoundEngine.playTachograph(vol);
          break;
        case 'wrong_way':
          TelemetrySoundEngine.playWrongWay(vol);
          break;
        case 'avoid_weighing':
        case 'illegal_trailer':
        case 'avoid_inspection':
        case 'illegal_border_crossing':
        case 'hard_shoulder_violation':
        case 'damaged_vehicle':
        case 'damaged_vehicle_usage':
        default:
          TelemetrySoundEngine.playWarningChime(vol);
          break;
      }
    } else if (type === 'tollgate') {
      TelemetrySoundEngine.playTollgate(vol);
    } else if (type === 'refuel') {
      TelemetrySoundEngine.playRefuel(vol);
    } else if (type === 'ferry') {
      TelemetrySoundEngine.playFerry(vol);
    } else if (type === 'train') {
      TelemetrySoundEngine.playTrain(vol);
    } else if (type === 'job_delivered') {
      TelemetrySoundEngine.playJobDelivered(vol);
    } else if (type === 'job_cancelled') {
      TelemetrySoundEngine.playJobCancelled(vol);
    } else if (type === 'cargo_damage') {
      TelemetrySoundEngine.playCargoDamage(vol);
    } else if (type === 'service') {
      TelemetrySoundEngine.playService(vol);
    } else if (type === 'low_fuel') {
      TelemetrySoundEngine.playLowFuel(vol);
    } else if (type === 'bus_stop') {
      TelemetrySoundEngine.playBusDoors(vol);
    } else if (type === 'bus_comfort' || type === 'bus_comfort_down') {
      TelemetrySoundEngine.playBusComfortWarn(vol);
    } else if (type === 'bus_comfort_up') {
      TelemetrySoundEngine.playBusComfortUp(vol);
    } else if (type === 'chat_honk') {
      TelemetrySoundEngine.playTruckPneumoHorn(vol);
    } else if (type === 'chat_cb') {
      TelemetrySoundEngine.playCBRadio(vol);
    } else if (type === 'chat_route' || type === 'chat_stats' || type === 'chat_truck' || type === 'chat_driver') {
      TelemetrySoundEngine.playWarningChime(vol * 0.7);
    } else if (type === 'update') {
      TelemetrySoundEngine.playCrtPowerOn(vol);
    }
  }

  function resolveEventDetails(event) {
    const type = event.type || 'fine';
    const offence = event.offence || '';
    const amount = Number(event.amount) || 0;
    const xp = Number(event.xp) || 0;
    const source = event.source || '';
    const target = event.target || '';

    let category = '';
    let title = '';
    let valueText = '';
    let subText = '';
    let badgeText = '';
    let svgIcon = '';
    let cardModifier = type;
    let summaryMetrics = null;
    let durationMs = 4500;

    if (type === 'fine') {
      category = t('eventCategoryFine');
      badgeText = t('badgeFine');
      cardModifier = 'fine';
      valueText = amount > 0 ? `− € ${formatIntWithSpaces(amount)}` : '';

      if (offence.startsWith('speeding')) {
        let targetLimit = 80;
        const match = offence.match(/speeding_(\d+)/);
        if (match && match[1]) {
          targetLimit = parseInt(match[1], 10);
        } else if (event.speedLimit && Number.isFinite(Number(event.speedLimit))) {
          targetLimit = snapToSpeedLimit(event.speedLimit);
        } else if (lastValidSpeedLimit > 0) {
          targetLimit = snapToSpeedLimit(lastValidSpeedLimit);
        }
        const isCamera = offence.includes('camera');
        title = isCamera ? t('eventFineSpeedingCamera') : t('eventFineSpeeding');
        svgIcon = generateSpeedLimitSignSvg(targetLimit, isCamera);
        subText = (lang === 'ru')
          ? `Превышение лимита ${targetLimit} км/ч`
          : `Speed Limit ${targetLimit} km/h Exceeded`;
      } else {
        switch (offence) {
          case 'red_signal':
            title = t('eventFineRedSignal');
            svgIcon = EVENT_SVG_ICONS.red_signal;
            break;
          case 'crash':
            title = t('eventFineCrash');
            svgIcon = EVENT_SVG_ICONS.crash;
            break;
          case 'no_lights':
            title = t('eventFineNoLights');
            svgIcon = EVENT_SVG_ICONS.no_lights;
            break;
          case 'avoid_sleeping':
            title = t('eventFineAvoidSleeping');
            svgIcon = EVENT_SVG_ICONS.avoid_sleeping;
            break;
          case 'wrong_way':
            title = t('eventFineWrongWay');
            svgIcon = EVENT_SVG_ICONS.wrong_way;
            break;
          case 'avoid_weighing':
            title = t('eventFineAvoidWeighing');
            svgIcon = EVENT_SVG_ICONS.avoid_weighing;
            break;
          case 'illegal_trailer':
            title = t('eventFineIllegalTrailer');
            svgIcon = EVENT_SVG_ICONS.illegal_trailer;
            break;
          case 'avoid_inspection':
            title = t('eventFineAvoidInspection');
            svgIcon = EVENT_SVG_ICONS.avoid_weighing;
            break;
          case 'illegal_border_crossing':
            title = t('eventFineIllegalBorderCrossing');
            svgIcon = EVENT_SVG_ICONS.illegal_border_crossing;
            break;
          case 'hard_shoulder_violation':
            title = t('eventFineHardShoulderViolation');
            svgIcon = EVENT_SVG_ICONS.hard_shoulder_violation;
            break;
          case 'damaged_vehicle':
          case 'damaged_vehicle_usage':
            title = t('eventFineDamagedVehicleUsage');
            svgIcon = EVENT_SVG_ICONS.damaged_vehicle;
            break;
          default:
            title = offence ? offence.replace(/_/g, ' ') : t('eventFineGeneric');
            svgIcon = EVENT_SVG_ICONS.generic_fine;
            break;
        }
      }
    } else if (type === 'tollgate') {
      category = t('eventCategoryToll');
      title = t('eventTollTitle');
      badgeText = t('badgeToll');
      cardModifier = 'tollgate';
      valueText = amount > 0 ? `− € ${formatIntWithSpaces(amount)}` : `€ 0`;
      svgIcon = EVENT_SVG_ICONS.tollgate;
    } else if (type === 'refuel') {
      category = t('eventCategoryRefuel');
      title = t('eventRefuelTitle');
      badgeText = t('badgeFuel');
      cardModifier = 'refuel';
      valueText = `+ ${amount} ${t('l')}`;
      if (event.currentFuel) {
        subText = `(${event.currentFuel} ${t('l')})`;
      }
      svgIcon = EVENT_SVG_ICONS.refuel;
    } else if (type === 'ferry') {
      category = t('eventCategoryFerry');
      title = (source && target) ? `${source} ➔ ${target}` : t('eventFerryTitle');
      badgeText = t('badgeFerry');
      cardModifier = 'ferry';
      valueText = amount > 0 ? `− € ${formatIntWithSpaces(amount)}` : `€ 0`;
      if (source && target) {
        subText = t('eventFerryTitle');
      }
      svgIcon = EVENT_SVG_ICONS.ferry;
    } else if (type === 'train') {
      category = t('eventCategoryTrain');
      title = (source && target) ? `${source} ➔ ${target}` : t('eventTrainTitle');
      badgeText = t('badgeTrain');
      cardModifier = 'train';
      valueText = amount > 0 ? `− € ${formatIntWithSpaces(amount)}` : `€ 0`;
      if (source && target) {
        subText = t('eventTrainTitle');
      }
      svgIcon = EVENT_SVG_ICONS.train;
    } else if (type === 'job_delivered') {
      const isBus = Boolean(event.isBusJob || (latestJobStateSnapshot && latestJobStateSnapshot.isBusJob) || (lastActiveJobSnapshot && lastActiveJobSnapshot.isBusJob));
      category = event.category || (isBus ? t('eventCategoryBusStop') : t('eventCategoryJobDelivered'));
      title = event.title || (isBus ? t('eventBusJobDeliveredTitle') : t('eventJobDeliveredTitle'));
      badgeText = isBus ? t('badgeCoach') : t('badgeDelivered');
      cardModifier = 'job_delivered';
      valueText = amount > 0 ? `+ € ${formatIntWithSpaces(amount)}` : `+ € 0`;
      if (xp > 0) {
        subText = `(+ ${xp} XP)`;
      }
      svgIcon = isBus ? EVENT_SVG_ICONS.bus_stop : EVENT_SVG_ICONS.job_delivered;
      if (event.summaryMetrics) {
        summaryMetrics = event.summaryMetrics;
        cardModifier = 'job_delivered event-toast-card--summary';
        durationMs = 7000;
      }
    } else if (type === 'job_cancelled') {
      const isBus = Boolean(event.isBusJob || (latestJobStateSnapshot && latestJobStateSnapshot.isBusJob) || (lastActiveJobSnapshot && lastActiveJobSnapshot.isBusJob));
      category = event.category || (isBus ? t('eventCategoryBusStop') : t('eventCategoryJobCancelled'));
      title = event.title || (isBus ? t('eventBusJobCancelledTitle') : t('eventJobCancelledTitle'));
      badgeText = isBus ? t('badgeCoach') : t('badgeCancelled');
      cardModifier = 'job_cancelled';
      valueText = amount > 0 ? `− € ${formatIntWithSpaces(amount)}` : `€ 0`;
      svgIcon = isBus ? EVENT_SVG_ICONS.bus_stop : EVENT_SVG_ICONS.job_cancelled;
    } else if (type === 'cargo_damage') {
      category = t('eventCategoryCargoDamage');
      title = event.title || t('eventCargoDamageTitle');
      badgeText = t('badgeDamage');
      cardModifier = 'cargo_damage';
      valueText = event.valueText || `+${event.amount || '1.0'}%`;
      svgIcon = EVENT_SVG_ICONS.cargo_damage;
    } else if (type === 'service') {
      category = t('eventCategoryService');
      title = event.title || t('eventServiceTitle');
      badgeText = t('badgeService');
      cardModifier = 'service';
      valueText = t('eventServiceValue');
      svgIcon = EVENT_SVG_ICONS.service;
    } else if (type === 'low_fuel') {
      category = t('eventCategoryLowFuel');
      title = event.title || t('eventLowFuelTitle');
      badgeText = t('badgeLowFuel');
      cardModifier = 'low_fuel';
      valueText = event.valueText || `${event.amount || 45} ${t('l')}`;
      if (event.subText) subText = event.subText;
      svgIcon = EVENT_SVG_ICONS.low_fuel;
    } else if (type === 'bus_stop') {
      category = t('eventCategoryBusStop');
      title = event.title || t('eventBusStopTitle');
      badgeText = t('badgeCoach');
      cardModifier = 'bus_stop';
      valueText = event.valueText || event.target || 'Station';
      svgIcon = EVENT_SVG_ICONS.bus_stop;
    } else if (type === 'bus_comfort' || type === 'bus_comfort_down') {
      category = t('eventCategoryBusComfort');
      title = event.title || t('eventBusComfortTitle');
      badgeText = t('badgeComfortDown');
      cardModifier = 'bus_comfort';
      const curSat = event.currentSat !== undefined ? ` (${event.currentSat}%)` : '';
      valueText = event.valueText || `-${event.amount || 10}%${curSat}`;
      if (event.subText) subText = event.subText;
      svgIcon = EVENT_SVG_ICONS.bus_comfort;
    } else if (type === 'bus_comfort_up') {
      category = t('eventCategoryBusComfort');
      title = event.title || t('eventBusComfortUpTitle');
      badgeText = t('badgeComfortUp');
      cardModifier = 'bus_comfort_up';
      const curSat = event.currentSat !== undefined ? ` (${event.currentSat}%)` : '';
      valueText = event.valueText || `+${event.amount || 5}%${curSat}`;
      if (event.subText) subText = event.subText;
      svgIcon = EVENT_SVG_ICONS.bus_comfort_up;
    } else if (type === 'chat_honk') {
      category = t('eventCategoryChatHonk');
      title = event.title || `${t('eventChatHonkTitle')} @${event.user || 'Viewer'}`;
      badgeText = t('badgeHonk');
      cardModifier = 'chat_honk';
      valueText = t('eventChatHonkValue');
      svgIcon = EVENT_SVG_ICONS.chat_honk;
    } else if (type === 'chat_cb') {
      category = t('eventCategoryChatCb');
      title = `@${event.user || 'Driver'}`;
      badgeText = t('badgeRadio');
      cardModifier = 'chat_cb';
      valueText = event.text || event.valueText || '';
      svgIcon = EVENT_SVG_ICONS.chat_cb;
    } else if (type === 'chat_route') {
      category = t('eventCategoryChatRoute');
      title = event.title || t('noRouteTitle');
      badgeText = t('badgeRoute');
      cardModifier = 'chat_info';
      valueText = event.valueText || '';
      subText = event.subText || '';
      svgIcon = EVENT_SVG_ICONS.chat_route;
    } else if (type === 'chat_stats') {
      category = t('eventCategoryChatStats');
      title = event.title || 'Stats';
      badgeText = t('badgeStats');
      cardModifier = 'chat_info';
      valueText = event.valueText || '';
      subText = event.subText || '';
      svgIcon = EVENT_SVG_ICONS.chat_stats;
    } else if (type === 'chat_truck') {
      category = t('eventCategoryChatTruck');
      title = event.title || 'Truck';
      badgeText = t('badgeTruck');
      cardModifier = 'chat_info';
      valueText = event.valueText || '';
      subText = event.subText || '';
      svgIcon = EVENT_SVG_ICONS.chat_truck;
    } else if (type === 'chat_driver') {
      category = t('eventCategoryChatDriver');
      title = event.title || 'Driver';
      badgeText = t('badgeDriver');
      cardModifier = 'chat_info';
      valueText = event.valueText || '';
      subText = event.subText || '';
      svgIcon = EVENT_SVG_ICONS.chat_driver;
    } else if (type === 'update') {
      category = t('eventCategoryUpdate') || (lang === 'en' ? 'SYSTEM // FIRMWARE' : 'СИСТЕМА // ОБНОВЛЕНИЕ');
      const newVer = event.version || event.tag_name || 'v1.2.2';
      title = `${t('eventUpdateTitle') || (lang === 'en' ? 'UPDATE AVAILABLE' : 'ДОСТУПНА ВЕРСИЯ')} ${newVer}`;
      badgeText = 'PIP-BOY 3000';
      cardModifier = 'update';
      valueText = t('eventUpdateDesc') || (lang === 'en'
        ? 'Run Update-Overlay.bat to install latest version.'
        : 'Запустите Update-Overlay.bat для установки.');
      subText = `${t('eventUpdateCurrent') || (lang === 'en' ? 'Current version:' : 'Текущая версия:')} ${OVERLAY_VERSION}`;
      svgIcon = EVENT_SVG_ICONS.update;
      durationMs = 12000;
    }

    return {
      category,
      title,
      valueText,
      subText,
      badgeText,
      svgIcon,
      cardModifier,
      summaryMetrics,
      durationMs
    };
  }

  const eventToastQueue = [];
  let isEventToastShowing = false;
  let eventToastTimer = null;
  let eventToastLeaveTimer = null;

  function enqueueTelemetryEvent(eventData) {
    const etsCfg = config.ets2 || {};
    if (etsCfg.eventsEnabled === false) return;
    eventToastQueue.push(eventData);
    processNextTelemetryEvent();
  }

  function processNextTelemetryEvent() {
    if (isEventToastShowing || eventToastQueue.length === 0) return;
    const eventData = eventToastQueue.shift();
    isEventToastShowing = true;

    showTelemetryEventCard(eventData, () => {
      isEventToastShowing = false;
      setTimeout(processNextTelemetryEvent, 250);
    });
  }

  function getToastContainer() {
    let container = global.document.getElementById('telemetry-event-toast');
    if (!container) {
      container = global.document.createElement('div');
      container.id = 'telemetry-event-toast';
      container.className = 'telemetry-event-toast';
      container.setAttribute('aria-live', 'assertive');
      container.setAttribute('aria-atomic', 'true');
      const scene = global.document.querySelector('.scene-desktop') ||
                    global.document.body;
      scene.appendChild(container);
    }
    return container;
  }

    function showTelemetryEventCard(eventData, onComplete) {
    const container = getToastContainer();
    const details = resolveEventDetails(eventData);

    const card = global.document.createElement('div');
    card.className = `event-toast-card event-toast-card--${details.cardModifier}`;

    let summaryHtml = '';
    if (details.summaryMetrics) {
      const sm = details.summaryMetrics;
      summaryHtml = `
        <div class="event-toast-summary-metrics">
          ${sm.route ? `<div class="event-toast-metric-item"><span class="event-toast-metric-label">${escapeHtml(t('eventSummaryRoute'))}</span> <span class="event-toast-metric-val">${escapeHtml(sm.route)}</span></div>` : ''}
          ${sm.distance ? `<div class="event-toast-metric-item"><span class="event-toast-metric-label">${escapeHtml(t('eventSummaryDistance'))}</span> <span class="event-toast-metric-val">${escapeHtml(sm.distance)}</span></div>` : ''}
          ${sm.revenue ? `<div class="event-toast-metric-item"><span class="event-toast-metric-label">${escapeHtml(t('eventSummaryRevenue'))}</span> <span class="event-toast-metric-val event-toast-metric-val--accent">+ € ${escapeHtml(formatIntWithSpaces(sm.revenue))}</span></div>` : ''}
          ${sm.xp ? `<div class="event-toast-metric-item"><span class="event-toast-metric-label">${escapeHtml(t('eventSummaryXP'))}</span> <span class="event-toast-metric-val">+ ${escapeHtml(sm.xp)} XP</span></div>` : ''}
          ${sm.finesText ? `<div class="event-toast-metric-item"><span class="event-toast-metric-label">${escapeHtml(t('eventSummaryFines'))}</span> <span class="event-toast-metric-val event-toast-metric-val--warn">${escapeHtml(sm.finesText)}</span></div>` : ''}
        </div>
        ${sm.winners ? `<div class="event-toast-winners-row"><span class="event-toast-winners-tag">${escapeHtml(t('badgeWinners'))}:</span> <span>${escapeHtml(sm.winners)}</span></div>` : ''}
      `;
    }

    card.innerHTML = `
      <div class="event-toast-icon-wrap" aria-hidden="true">
        ${details.svgIcon}
      </div>
      <div class="event-toast-content">
        <div class="event-toast-head">
          <span class="event-toast-category">${escapeHtml(details.category)}</span>
          ${details.badgeText ? `<span class="event-toast-badge">${escapeHtml(details.badgeText)}</span>` : ''}
        </div>
        <div class="event-toast-title">${escapeHtml(details.title)}</div>
        <div class="event-toast-desc">
          ${details.valueText ? `<span class="event-toast-value">${escapeHtml(details.valueText)}</span>` : ''}
          ${details.subText ? `<span class="event-toast-sub">${escapeHtml(details.subText)}</span>` : ''}
        </div>
        ${summaryHtml}
      </div>
    `;

    container.innerHTML = '';
    container.appendChild(card);

    playEventAudio(eventData.type, eventData.offence);

    // Кинематика появления: плавный выезд сверху вниз (или CRT Power-On)
    requestAnimationFrame(() => {
      card.classList.add('is-visible', 'active', 'show');
    });

    // Эффект печатной машинки (typewriter) для карточки обновления Pip-Boy 3000
    if (details.cardModifier === 'update' || eventData.type === 'update') {
      const descEl = card.querySelector('.event-toast-desc');
      if (descEl) {
        descEl.classList.add('event-toast-desc--update');
        const textVal = details.valueText || '';
        const textSub = details.subText || '';
        descEl.innerHTML = `<span class="event-toast-typewriter-text"></span><span class="event-toast-cursor">▌</span>${textSub ? `<br><span class="event-toast-sub" style="opacity:0.8;font-size:12.5px;">${escapeHtml(textSub)}</span>` : ''}`;
        const targetSpan = descEl.querySelector('.event-toast-typewriter-text');
        if (targetSpan && textVal) {
          let charIdx = 0;
          const etsCfg = config.ets2 || {};
          const vol = typeof etsCfg.eventSoundVolume === 'number' ? etsCfg.eventSoundVolume : 0.65;
          const typeInterval = setInterval(() => {
            if (charIdx < textVal.length) {
              targetSpan.textContent += textVal[charIdx];
              charIdx++;
              if (charIdx % 2 === 0) {
                TelemetrySoundEngine.playTerminalTick(vol * 0.4);
              }
            } else {
              clearInterval(typeInterval);
            }
          }, 22);
        }
      }
    }

    const displayMs = Math.max(3000, Number(details.durationMs) || 4500);

    if (eventToastTimer) clearTimeout(eventToastTimer);
    eventToastTimer = setTimeout(() => {
      // Для обновления проигрываем звук выключения CRT
      if (details.cardModifier === 'update' || eventData.type === 'update') {
        const etsCfg = config.ets2 || {};
        const vol = typeof etsCfg.eventSoundVolume === 'number' ? etsCfg.eventSoundVolume : 0.65;
        TelemetrySoundEngine.playCrtPowerOff(vol);
      }

      // Кинематика растворения: остаётся на месте и плавно затухает (или CRT Power-Off)
      card.classList.remove('is-visible', 'active', 'show');
      card.classList.add('is-leaving', 'hiding', 'fade-out');

      if (eventToastLeaveTimer) clearTimeout(eventToastLeaveTimer);
      eventToastLeaveTimer = setTimeout(() => {
        if (card.parentNode === container) {
          container.removeChild(card);
        }
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }, 480);
    }, displayMs);
  }

  const sessionStats = {
    jobsCompleted: 0,
    kmDriven: 0,
    maxSpeed: 0,
    revenue: 0,
    finesCount: 0,
    finesTotal: 0,
    refuelsCount: 0,
    currentTripFines: 0,
    currentTripFinesAmount: 0,
    safetyScore: 100
  };

  const tripBets = new Map();

  let lastCargoDmg = null;
  let lastTruckWear = null;
  let lastCargoDmgAlertAt = 0;
  let lastServiceAlertAt = 0;
  let lowFuelAlerted = false;
  let lastBusStopId = null;
  let lastReportedBusSat = null;
  let prevBusSat = null;
  let lastComfortToastAt = 0;
  let wasJobActive = false;
  let lastActiveJobSnapshot = null;
  let lastJobDeliveredOrCancelledAt = 0;
  let latestJobStateSnapshot = null;
  let latestIdentitySnapshot = null;

  function checkCargoAndDamageEvents(data, speedKmh) {
    const now = Date.now();
    const currentCargoDmg = parseFiniteTelemetryNumber(
      data.cargoDmg ?? data.jobDmg ?? (data.cargo && data.cargo.damage)
    );

    const wEng = Number(data.wEngine ?? (data.truck && data.truck.wearEngine) ?? 0);
    const wCh = Number(data.wChassis ?? (data.truck && data.truck.wearChassis) ?? 0);
    const wTr = Number(data.wTrans ?? (data.truck && data.truck.wearTransmission) ?? 0);
    const wCb = Number(data.wCabin ?? (data.truck && data.truck.wearCabin) ?? 0);
    const currentTruckWear = (wEng * 0.35 + wCh * 0.35 + wTr * 0.15 + wCb * 0.15);

    if (lastCargoDmg !== null && currentCargoDmg !== null) {
      const deltaCargo = currentCargoDmg - lastCargoDmg;
      if (deltaCargo >= 0.009 && (now - lastCargoDmgAlertAt >= 5000)) {
        lastCargoDmgAlertAt = now;
        enqueueTelemetryEvent({
          type: 'cargo_damage',
          amount: (deltaCargo * 100).toFixed(1),
          valueText: `+${(deltaCargo * 100).toFixed(1)}%`
        });
        sessionStats.safetyScore = Math.max(10, sessionStats.safetyScore - 8);
      }
    }

    if (lastTruckWear !== null) {
      const deltaWear = currentTruckWear - lastTruckWear;
      if (deltaWear >= 0.03 && (now - lastCargoDmgAlertAt >= 5000)) {
        lastCargoDmgAlertAt = now;
        enqueueTelemetryEvent({
          type: 'cargo_damage',
          title: t('eventCategoryCargoDamage'),
          amount: (deltaWear * 100).toFixed(1),
          valueText: `+${(deltaWear * 100).toFixed(1)}%`
        });
        sessionStats.safetyScore = Math.max(10, sessionStats.safetyScore - 5);
      }

      if (speedKmh < 1.0 && lastTruckWear >= 0.03 && currentTruckWear <= 0.005) {
        if (now - lastServiceAlertAt >= 10000) {
          lastServiceAlertAt = now;
          enqueueTelemetryEvent({ type: 'service' });
        }
      }
    }

    lastCargoDmg = currentCargoDmg;
    lastTruckWear = currentTruckWear;
  }

  function checkLowFuelWarning(currentFuel, data) {
    if (typeof currentFuel !== 'number' || !Number.isFinite(currentFuel) || currentFuel <= 0) return;
    const fuelCap = parseFiniteTelemetryNumber(data.fuelCapacity ?? (data.fuel && data.fuel.capacity)) || 600;
    const isWarn = isTruthyTelemetryFlag(data.fuelWarning ?? data.fuelWarn ?? (data.fuel && data.fuel.warning));

    if (currentFuel < fuelCap * 0.12 || isWarn) {
      if (!lowFuelAlerted) {
        lowFuelAlerted = true;
        const rawRange = data.fuelRange ?? (data.fuel && data.fuel.range);
        const rangeText = rawRange ? `(~${Math.round(rawRange)} ${t('km')})` : '';
        enqueueTelemetryEvent({
          type: 'low_fuel',
          amount: Math.round(currentFuel),
          valueText: `${Math.round(currentFuel)} ${t('l')}`,
          subText: rangeText
        });
      }
    } else if (currentFuel > fuelCap * 0.25) {
      lowFuelAlerted = false;
    }
  }

  function checkBusEvents(data, isJobActive) {
    const isBus = Boolean(
      isTruthyTelemetryFlag(data.isBusJob) ||
      isTruthyTelemetryFlag(data.busJob) ||
      data.jobMarket === 'bus_job' ||
      data.jobMarket === 'coach' ||
      (latestJobStateSnapshot && latestJobStateSnapshot.isBusJob)
    );

    // Сброс опорных значений при отсутствии автобуса или неактивном рейсе
    if (!isBus || !isJobActive) {
      lastReportedBusSat = null;
      prevBusSat = null;
      lastBusStopId = null;
      return;
    }

    const stopName = (data.destinationStop && (data.destinationStop.name || data.destinationStop.id)) ||
                     (data.sourceStop && (data.sourceStop.name || data.sourceStop.id));
    if (stopName && stopName !== lastBusStopId) {
      if (lastBusStopId !== null) {
        enqueueTelemetryEvent({
          type: 'bus_stop',
          target: stopName,
          valueText: stopName
        });
      }
      lastBusStopId = stopName;
    }

    const rawSat = parseFiniteTelemetryNumber(
      data.busSat ?? (data.tel && data.tel.busSat) ?? (data.trip && data.trip.busSat) ?? (data.cfg && data.cfg.bus && data.cfg.bus.satisfaction)
    );
    if (rawSat === null) return;
    const currentBusSat = Math.round(rawSat > 1.0 ? rawSat : rawSat * 100.0);

    // 1. БЛОКИРОВКА ЛОЖНОГО -100% КОМФОРТА:
    // Если busSat падает до 0 (или <= 1), либо одновременно пропадает активный заказ/маршрут,
    // КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО триггерить событие падения комфорта!
    // Сброс busSat в 0 означает закрытие автобусного маршрута, а не падение комфорта.
    if (currentBusSat <= 1) {
      lastReportedBusSat = null;
      prevBusSat = null;
      return;
    }

    // Первичная инициализация эталонного значения при старте рейса
    if (lastReportedBusSat === null || prevBusSat === null) {
      lastReportedBusSat = currentBusSat;
      prevBusSat = currentBusSat;
      return;
    }

    // Отслеживание изменений только когда автобусный рейс реально активен и prevBusSat > 0 и currentBusSat > 0
    if (prevBusSat > 0 && currentBusSat > 0) {
      const now = Date.now();
      const delta = currentBusSat - lastReportedBusSat;

      // Падение комфорта (bus_comfort): currentBusSat < lastReportedBusSat
      if (delta <= -1) {
        if (now - lastComfortToastAt >= 4000) {
          const drop = Math.abs(delta);
          lastComfortToastAt = now;
          lastReportedBusSat = currentBusSat;
          enqueueTelemetryEvent({
            type: 'bus_comfort',
            amount: drop,
            currentSat: currentBusSat,
            valueText: `-${drop}% (${currentBusSat}%)`,
            title: lang === 'ru' ? 'Резкое падение комфорта' : 'Comfort Rating Drop',
            subText: lang === 'ru' ? `Рейтинг комфорта: ${currentBusSat}%` : `Comfort rating: ${currentBusSat}%`
          });
        }
      }
      // Увеличение комфорта (bus_comfort_up): currentBusSat > lastReportedBusSat
      else if (delta >= 1) {
        if (now - lastComfortToastAt >= 4000) {
          const gain = delta;
          lastComfortToastAt = now;
          lastReportedBusSat = currentBusSat;
          enqueueTelemetryEvent({
            type: 'bus_comfort_up',
            amount: gain,
            currentSat: currentBusSat,
            valueText: `+${gain}% (${currentBusSat}%)`,
            title: lang === 'ru' ? 'Комфорт пассажиров повышен' : 'Passenger Comfort Increased',
            subText: lang === 'ru' ? `Рейтинг комфорта: ${currentBusSat}%` : `Comfort rating: ${currentBusSat}%`
          });
        }
      }
    }

    prevBusSat = currentBusSat;
  }

  let prevFuel = null;
  const refuelTracking = {
    active: false,
    startFuel: 0,
    lastFuel: 0,
    lastIncreaseTime: 0
  };

  function checkRefuelProgress(currentFuel, speedKmh) {
    if (typeof currentFuel !== 'number' || !Number.isFinite(currentFuel) || currentFuel <= 0) return;

    if (prevFuel === null) {
      prevFuel = currentFuel;
      return;
    }

    const now = Date.now();

    if (speedKmh < 1.0) {
      const benchmarkFuel = refuelTracking.active ? refuelTracking.lastFuel : prevFuel;
      if (currentFuel > benchmarkFuel + 0.25) {
        if (!refuelTracking.active) {
          refuelTracking.active = true;
          refuelTracking.startFuel = prevFuel;
        }
        refuelTracking.lastFuel = currentFuel;
        refuelTracking.lastIncreaseTime = now;
      }
    }

    if (refuelTracking.active) {
      const timeSinceIncrease = now - refuelTracking.lastIncreaseTime;
      const speedMoved = speedKmh >= 1.0;
      const fuelStopped = timeSinceIncrease >= 2000;

      if (fuelStopped || speedMoved) {
        const addedLiters = Math.round(refuelTracking.lastFuel - refuelTracking.startFuel);
        refuelTracking.active = false;
        if (addedLiters >= 5) {
          sessionStats.refuelsCount += 1;
          enqueueTelemetryEvent({
            type: 'refuel',
            amount: addedLiters,
            currentFuel: Math.round(refuelTracking.lastFuel)
          });
        }
      }
    }

    prevFuel = currentFuel;
  }

  let lastProcessedEventSeq = 0;

  function handleIncomingTelemetryEvent(lastEvent) {
    if (!lastEvent || typeof lastEvent !== 'object') return;
    const seq = Number(lastEvent.seq);
    if (!Number.isFinite(seq) || seq <= 0) return;

    if (lastProcessedEventSeq === 0) {
      lastProcessedEventSeq = seq;
      return;
    }

    if (seq > lastProcessedEventSeq) {
      lastProcessedEventSeq = seq;

      if (lastEvent.type === 'fine') {
        const amt = Number(lastEvent.amount) || 0;
        sessionStats.finesCount += 1;
        sessionStats.finesTotal += amt;
        sessionStats.currentTripFines += 1;
        sessionStats.currentTripFinesAmount += amt;
        sessionStats.safetyScore = Math.max(10, sessionStats.safetyScore - 4);
      } else if (lastEvent.type === 'job_delivered') {
        lastJobDeliveredOrCancelledAt = Date.now();
        const amt = Number(lastEvent.amount) || 0;
        sessionStats.jobsCompleted += 1;
        sessionStats.revenue += amt;

        const outcome = sessionStats.currentTripFines === 0 ? 'clean' : 'fine';
        const winningUsers = [];
        tripBets.forEach((bet, user) => {
          if (bet === outcome) winningUsers.push(`@${user}`);
        });

        const routeText = (lastEvent.summaryMetrics && lastEvent.summaryMetrics.route) ||
                          (latestJobStateSnapshot ? (latestJobStateSnapshot.routeText || latestJobStateSnapshot.text) : '') ||
                          (lastActiveJobSnapshot ? lastActiveJobSnapshot.routeText : '');
        const distText = (latestJobStateSnapshot ? (latestJobStateSnapshot.distanceText || latestJobStateSnapshot.meta) : '') ||
                         (lastActiveJobSnapshot && lastActiveJobSnapshot.plannedKm ? `${lastActiveJobSnapshot.plannedKm} ${t('km')}` : '');
        const finesSummary = sessionStats.currentTripFines === 0
          ? (lang === 'ru' ? '0 (ЧИСТЫЙ РЕЙС)' : '0 (CLEAN TRIP)')
          : `${sessionStats.currentTripFines} (€ ${formatIntWithSpaces(sessionStats.currentTripFinesAmount)})`;

        lastEvent.summaryMetrics = {
          route: routeText,
          distance: distText,
          revenue: amt,
          xp: Number(lastEvent.xp) || (lastEvent.isBusJob ? 450 : 600),
          finesText: finesSummary,
          winners: winningUsers.length > 0 ? winningUsers.join(', ') : t('eventSummaryNoBets')
        };

        tripBets.clear();
        sessionStats.currentTripFines = 0;
        sessionStats.currentTripFinesAmount = 0;
      } else if (lastEvent.type === 'job_cancelled') {
        lastJobDeliveredOrCancelledAt = Date.now();
        tripBets.clear();
        sessionStats.currentTripFines = 0;
        sessionStats.currentTripFinesAmount = 0;
      }

      enqueueTelemetryEvent(lastEvent);
    }
  }

  app.triggerChatCommand = function(cmdType, username, text, meta) {
    const etsCfg = config.ets2 || {};
    if (etsCfg.eventsEnabled === false) return;

    if (cmdType === 'honk') {
      enqueueTelemetryEvent({
        type: 'chat_honk',
        user: username
      });
    } else if (cmdType === 'cb') {
      enqueueTelemetryEvent({
        type: 'chat_cb',
        user: username,
        text: text
      });
    } else if (cmdType === 'route') {
      const routeText = (latestJobStateSnapshot && latestJobStateSnapshot.routeText) || config.ets2.routeText || t('noRouteTitle');
      const dist = (latestJobStateSnapshot && latestJobStateSnapshot.distanceText) || '';
      enqueueTelemetryEvent({
        type: 'chat_route',
        title: routeText,
        valueText: dist ? `${t('range')}: ${dist}` : ''
      });
    } else if (cmdType === 'stats') {
      const revText = `€ ${formatIntWithSpaces(sessionStats.revenue)}`;
      const finesText = `${sessionStats.finesCount} (€ ${formatIntWithSpaces(sessionStats.finesTotal)})`;
      enqueueTelemetryEvent({
        type: 'chat_stats',
        title: lang === 'ru'
          ? `Рейсов: ${sessionStats.jobsCompleted} | Доход: ${revText}`
          : `Jobs: ${sessionStats.jobsCompleted} | Revenue: ${revText}`,
        valueText: lang === 'ru'
          ? `Пройдено: ${sessionStats.kmDriven} км | Штрафов: ${finesText}`
          : `Driven: ${sessionStats.kmDriven} km | Fines: ${finesText}`
      });
    } else if (cmdType === 'truck') {
      const model = (latestIdentitySnapshot && latestIdentitySnapshot.modelText) || 'MAN / SCANIA / VOLVO';
      const plate = (latestIdentitySnapshot && latestIdentitySnapshot.plateText) || '';
      const fuelStr = prevFuel ? `${Math.round(prevFuel)} ${t('l')}` : '';
      enqueueTelemetryEvent({
        type: 'chat_truck',
        title: model,
        valueText: plate ? `[${plate}] ${fuelStr}` : fuelStr
      });
    } else if (cmdType === 'driver') {
      const driver = config.ets2.driverName || 'FOOZZEE';
      enqueueTelemetryEvent({
        type: 'chat_driver',
        title: `${t('driverPrefix')}: ${driver}`,
        valueText: `Safety Score: ${sessionStats.safetyScore}% | Max: ${sessionStats.maxSpeed} ${t('kmh')}`
      });
    }
  };

  app.recordTripBet = function(username, betType) {
    if (!username) return;
    const cleanBet = (betType === 'clean' || betType === 'чистый') ? 'clean' :
                    (betType === 'fine' || betType === 'штраф') ? 'fine' : null;
    if (cleanBet) {
      tripBets.set(String(username).toLowerCase(), cleanBet);
      return true;
    }
    return false;
  };

  app.getSessionStats = function() {
    return { ...sessionStats, activeBets: tripBets.size };
  };

  global.testTelemetryEvent = function(type, offence, customAmount) {
    let tKind = String(type || 'fine').toLowerCase();
    let off = String(offence || '').toLowerCase();

    // Быстрые сокращения для вызовов вроде testTelemetryEvent('speeding_60') или ('bus_comfort_up')
    if (tKind === 'update') {
      enqueueTelemetryEvent({
        seq: Date.now(),
        type: 'update',
        version: offence || 'v1.2.3',
        offence: 'update'
      });
      return;
    } else if (tKind.startsWith('speeding')) {
      off = tKind;
      tKind = 'fine';
    } else if (tKind === 'bus_comfort_up') {
      tKind = 'bus_comfort_up';
    } else if (tKind === 'bus_comfort_down') {
      tKind = 'bus_comfort';
    }

    const knownOffences = [
      'speeding', 'speeding_camera', 'red_signal', 'crash', 'no_lights',
      'avoid_sleeping', 'wrong_way', 'avoid_weighing', 'illegal_trailer',
      'avoid_inspection', 'illegal_border_crossing', 'hard_shoulder_violation',
      'damaged_vehicle', 'damaged_vehicle_usage', 'generic'
    ];
    if (knownOffences.includes(tKind)) {
      off = tKind;
      tKind = 'fine';
    }

    const mock = {
      seq: Date.now(),
      type: tKind,
      offence: off,
      amount: Number(customAmount) || 0,
      xp: 0,
      source: '',
      target: ''
    };

    if (tKind === 'fine') {
      if (!off) off = 'speeding';
      mock.offence = off;
      mock.amount = customAmount ? Number(customAmount) :
                    off.startsWith('speeding') ? 550 :
                    (off === 'red_signal') ? 350 :
                    (off === 'crash') ? 400 :
                    (off === 'no_lights') ? 150 :
                    (off === 'avoid_sleeping') ? 150 :
                    (off === 'wrong_way') ? 100 : 250;

      const limitMatch = off.match(/speeding_(\d+)/);
      if (limitMatch && limitMatch[1]) {
        mock.speedLimit = parseInt(limitMatch[1], 10);
      }
    } else if (tKind === 'tollgate') {
      mock.amount = customAmount ? Number(customAmount) : 45;
    } else if (tKind === 'refuel') {
      mock.amount = customAmount ? Number(customAmount) : 185;
      mock.currentFuel = 540;
    } else if (tKind === 'ferry') {
      mock.amount = customAmount ? Number(customAmount) : 320;
      mock.source = lang === 'ru' ? 'Дувр' : 'Dover';
      mock.target = lang === 'ru' ? 'Кале' : 'Calais';
    } else if (tKind === 'train') {
      mock.amount = customAmount ? Number(customAmount) : 260;
      mock.source = lang === 'ru' ? 'Фолкстон' : 'Folkestone';
      mock.target = lang === 'ru' ? 'Кале' : 'Calais';
    } else if (tKind === 'job_delivered') {
      const isBus = (off === 'bus' || off === 'coach');
      mock.isBusJob = isBus;
      mock.amount = customAmount ? Number(customAmount) : (isBus ? 8400 : 14850);
      mock.xp = isBus ? 520 : 980;
      mock.summaryMetrics = {
        route: isBus
          ? (lang === 'ru' ? 'Берлин ZOB → Мюнхен ZOB' : 'Berlin ZOB → Munich ZOB')
          : (lang === 'ru' ? 'Берлин → Париж (24Т)' : 'Berlin → Paris (24T)'),
        distance: isBus ? '580 км' : '1 050 км',
        revenue: mock.amount,
        xp: mock.xp,
        finesText: lang === 'ru' ? '0 (ЧИСТЫЙ РЕЙС)' : '0 (CLEAN TRIP)',
        winners: '@VipViewer, @Trucker_77'
      };
    } else if (tKind === 'job_cancelled') {
      const isBus = (off === 'bus' || off === 'coach');
      mock.isBusJob = isBus;
      mock.amount = customAmount ? Number(customAmount) : (isBus ? 0 : 12000);
    } else if (tKind === 'cargo_damage') {
      mock.amount = customAmount || '2.5';
      mock.valueText = `+${mock.amount}%`;
    } else if (tKind === 'service') {
      mock.valueText = t('eventServiceValue');
    } else if (tKind === 'low_fuel') {
      mock.amount = customAmount || 55;
      mock.subText = '(~110 км)';
    } else if (tKind === 'bus_stop') {
      mock.target = off || 'Berlin ZOB';
    } else if (tKind === 'bus_comfort' || tKind === 'bus_comfort_down') {
      mock.type = 'bus_comfort';
      mock.amount = customAmount || 12;
      mock.currentSat = 82;
      mock.valueText = `-${mock.amount}% (82%)`;
      mock.subText = lang === 'ru' ? 'Рейтинг комфорта: 82%' : 'Comfort rating: 82%';
    } else if (tKind === 'bus_comfort_up') {
      mock.type = 'bus_comfort_up';
      mock.amount = customAmount || 6;
      mock.currentSat = 96;
      mock.valueText = `+${mock.amount}% (96%)`;
      mock.subText = lang === 'ru' ? 'Рейтинг комфорта: 96%' : 'Comfort rating: 96%';
    } else if (tKind === 'chat_honk') {
      mock.user = off || 'VipFan';
    } else if (tKind === 'chat_cb') {
      mock.user = off || 'Trucker_99';
      mock.text = '15 канал, как дорожка на Мюнхен?';
    } else if (tKind === 'chat_route' || tKind === 'chat_stats' || tKind === 'chat_truck' || tKind === 'chat_driver') {
      mock.title = 'Test Card';
      mock.valueText = 'Test Value';
    }

    enqueueTelemetryEvent(mock);
    return `[ETS2 Event Test] Dispatched: type="${tKind}", offence="${mock.offence}", amount=${mock.amount}`;
  };

  global.demoAllTelemetryEvents = function() {
    const list = [
      { type: 'chat_honk', user: 'VipViewer' },
      { type: 'chat_cb', user: 'Trucker_77', text: 'Всем привет в 15 канале! На Париж чисто?' },
      { type: 'cargo_damage', amount: '2.5', valueText: '+2.5%' },
      { type: 'fine', offence: 'speeding', amount: 550 },
      { type: 'fine', offence: 'red_signal', amount: 350 },
      { type: 'tollgate', amount: 48 },
      { type: 'refuel', amount: 240, currentFuel: 680 },
      { type: 'service' },
      { type: 'low_fuel', amount: 65, subText: '(~120 км)' },
      { type: 'bus_stop', target: 'Berlin Hbf' },
      { type: 'bus_comfort', amount: 15, valueText: '-15%' },
      { type: 'ferry', amount: 320, source: 'Dover', target: 'Calais' },
      {
        type: 'job_delivered',
        amount: 28400,
        xp: 1450,
        summaryMetrics: {
          route: lang === 'ru' ? 'Берлин → Париж (24Т)' : 'Berlin → Paris (24T)',
          distance: '1 050 км',
          revenue: 28400,
          xp: 1450,
          finesText: lang === 'ru' ? '0 (ЧИСТЫЙ РЕЙС)' : '0 (CLEAN TRIP)',
          winners: '@VipViewer, @SubPilot, @Trucker_77'
        }
      }
    ];

    list.forEach((evt) => {
      enqueueTelemetryEvent(evt);
    });

    return `[Demo] Enqueued ${list.length} telemetry events sequentially!`;
  };

  function renderTelemetryPacket(rawData) {
    const data = unwrapTelemetryPayload(rawData);
    if (!data || typeof data !== 'object') return;
    if (data.ok === false || data.connected === false || data._offline === true) {
      showTelemetryStandby();
      return;
    }

    const apiCfg = (config.ets2 && config.ets2.telemetryApi) || {};
    const speedMult = detectSpeedMultiplier(data, apiCfg.speedUnit || 'auto');

    const rawSpeed = data.speed ?? (data.truck && data.truck.speed) ?? data.speedMs ?? 0;
    const speedKmh = Math.max(0, Math.round(Math.abs(Number(rawSpeed) || 0) * speedMult));
    const limitRaw = Number(data.speedLimit ?? (data.navigation && data.navigation.speedLimit));
    const limitKmh = Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.round(limitRaw * speedMult)
      : 0;

    if (limitKmh >= 15) {
      lastValidSpeedLimit = limitKmh;
    }

    const ccSource =
      data.cruise ??
      data.cc ??
      data.cruiseControl ??
      (data.tel && (data.tel.cruise ?? data.tel.cc ?? data.tel.cruiseControl)) ??
      0;
    const ccNumeric = typeof ccSource === 'object' && ccSource !== null
      ? Number(ccSource.speed ?? ccSource.value ?? 0)
      : Number(ccSource);
    const ccSpeed = Number.isFinite(ccNumeric) && ccNumeric > 0
      ? Math.round(ccNumeric * speedMult)
      : 0;
    const isCcActive = Boolean(
      isTruthyTelemetryFlag(data.cruiseOn) ||
      (data.tel && isTruthyTelemetryFlag(data.tel.cruiseOn)) ||
      data.cruise === true ||
      ccSpeed > 0
    );

    const rawRpm =
      data.rpm ??
      data.engineRpm ??
      (data.truck && (data.truck.engineRpm ?? data.truck.rpm)) ??
      0;
    const rpm = Math.max(0, Math.round(Number(rawRpm) || 0));
    const maxRpm = Math.max(1500, Number(data.rpmLimit) || Number(apiCfg.maxRpm) || 2500);
    const rpmRatio = Math.max(0, Math.min(1, rpm / maxRpm));

    const speedEl = global.document.getElementById('lt-speed');
    const speedBlockEl = global.document.getElementById('lt-speed-block');
    const rpmTextEl = global.document.getElementById('lt-rpm-text');
    const rpmFillEl = global.document.getElementById('lt-rpm-fill');
    const limitEl = global.document.getElementById('lt-limit');
    const cruiseEl = global.document.getElementById('lt-cruise');
    const gearEl = global.document.getElementById('lt-gear');
    const fuelEl = global.document.getElementById('lt-fuel');
    const sensorFuelEl = global.document.getElementById('lt-sensor-fuel');
    const navEl = global.document.getElementById('lt-nav');
    const routeProgressEl = global.document.getElementById('lt-route-progress-fill');
    const cargoChipEl = global.document.getElementById('lt-cargo-chip');
    const cargoEl = global.document.getElementById('lt-cargo');

    const truckModelEl = global.document.getElementById('lt-truck-model');
    const truckPlateEl = global.document.getElementById('lt-truck-plate');
    const truckHealthEl = global.document.getElementById('lt-truck-health');
    const trailerHealthEl = global.document.getElementById('lt-trailer-health');
    const cargoHealthEl = global.document.getElementById('lt-cargo-health');
    const truckOdoEl = global.document.getElementById('lt-truck-odometer');
    const fuelAvgEl = global.document.getElementById('lt-sensor-fuel-avg');
    const tempsEl = global.document.getElementById('lt-sensor-temps');
    const airEl = global.document.getElementById('lt-sensor-air');
    const adblueEl = global.document.getElementById('lt-sensor-adblue');
    const batteryEl = global.document.getElementById('lt-sensor-battery');
    const rangeEl = global.document.getElementById('lt-sensor-range');

    const rawRange = data.fuelRange ??
      (data.fuel && typeof data.fuel === 'object' ? data.fuel.range : undefined);

    const identity = resolveTruckIdentity(data);
    const gameId = resolveGameId(data, identity.brand || identity.modelText);
    const displayUnit = resolveDisplaySpeedUnit(gameId);
    const speedDisplayVal = displayUnit === 'mph' ? Math.round(speedKmh / 1.609344) : speedKmh;
    const limitDisplayVal = displayUnit === 'mph' && limitKmh > 0 ? Math.round(limitKmh / 1.609344) : limitKmh;
    const ccDisplayVal = displayUnit === 'mph' && ccSpeed > 0 ? Math.round(ccSpeed / 1.609344) : ccSpeed;
    const rawGearVal = resolveRawGear(data);

    if (speedEl) speedEl.textContent = String(speedDisplayVal);
    if (speedBlockEl) {
      speedBlockEl.classList.toggle('is-overspeed', limitKmh > 0 && speedKmh > limitKmh + 4);
    }

    if (rpmTextEl) rpmTextEl.textContent = `${rpm} ${t('rpm')}`;
    if (rpmFillEl) {
      rpmFillEl.style.transform = `scaleX(${rpmRatio.toFixed(3)})`;
      rpmFillEl.classList.toggle('is-redline', rpmRatio >= 0.84);
    }

    if (limitEl) {
      limitEl.textContent = limitDisplayVal > 0 ? String(limitDisplayVal) : '--';
      limitEl.classList.toggle('is-inactive', limitDisplayVal <= 0);
    }

    if (cruiseEl) {
      if (isCcActive) {
        cruiseEl.textContent = ccDisplayVal > 0 ? `${t('cruisePill')} ${ccDisplayVal}` : t('cruiseOn');
        cruiseEl.classList.add('is-active');
      } else {
        cruiseEl.textContent = t('cruiseStandby');
        cruiseEl.classList.remove('is-active');
      }
    }

    if (gearEl) {
      gearEl.textContent = formatGearLabel(rawGearVal);
    }

    updateInstrumentClusterGauges(speedKmh, rpm, displayUnit, rawGearVal, data);
    applyDashboardInputs(data);
    applyDashboardIndicators(data);

    if (fuelEl) {
      fuelEl.textContent = formatFuelText(data.fuel, rawRange);
    }
    if (sensorFuelEl) {
      sensorFuelEl.textContent = formatFuelLitersOnly(data.fuel);
    }

    const navInputs = resolveNavInputs(data);
    const navFormatted = formatNavText(navInputs.navDist, navInputs.navTime, apiCfg);
    if (navEl) {
      navEl.textContent = navFormatted;
    }
    applyRealEtaDisplay(resolveRealEtaState(navInputs, apiCfg));

    const jobState = resolveJobAndRouteState(data, gameId, navInputs);
    setRouteDisplay(jobState.text, jobState.meta, jobState.tag);

    const trailerState = resolveTrailerAndCargoState(data, jobState);
    if (cargoChipEl && cargoEl) {
      cargoChipEl.classList.remove('is-ok', 'is-warn', 'is-danger', 'is-detached');
      cargoChipEl.classList.add(trailerState.statusClass);
      cargoChipEl.title = trailerState.title;
      cargoEl.textContent = trailerState.text;
    }
    updateTopTickerValues({
      navDist: navFormatted,
      cargo: trailerState.text
    });

    if (routeProgressEl) {
      const navMeters = resolveNavDistanceMeters(navInputs.navDist, apiCfg);
      const navKm = navMeters !== null ? navMeters / 1000 : null;
      let progressRatio = 0;
      if (jobState.hasJob && jobState.plannedKm && jobState.plannedKm > 0 && navKm !== null) {
        progressRatio = Math.max(0, Math.min(1, (jobState.plannedKm - navKm) / jobState.plannedKm));
      }
      routeProgressEl.style.transform = `scaleX(${progressRatio.toFixed(3)})`;
    }

    if (truckModelEl) truckModelEl.textContent = identity.modelText;
    if (truckPlateEl) {
      truckPlateEl.textContent = identity.plateText;
      truckPlateEl.classList.toggle('is-empty', !identity.plateText);
    }

    const truckPct = resolveTruckHealthPct(data);
    const trailerPct = resolveTrailerHealthPct(data, trailerState.connected);
    const cargoPct = resolveCargoHealthPct(data, jobState.hasJob || trailerState.hasCargo);

    applyHealthBadgeState(truckHealthEl, t('truckPrefix'), truckPct, t('truckHealthTitle'), t('truckHealthTitle'));
    applyHealthBadgeState(trailerHealthEl, t('trailerPrefix'), trailerPct, t('trailerHealthTitle'), t('trailerHealthTitle'));
    applyHealthBadgeState(cargoHealthEl, t('cargoPrefix'), cargoPct, t('cargoHealthTitle'), t('cargoHealthTitle'));

    if (truckOdoEl) {
      const odoVal = parseFiniteTelemetryNumber(
        data.odometer ?? (data.truck && data.truck.odometer) ?? (data.cfg && data.cfg.odometer)
      );
      truckOdoEl.textContent = odoVal !== null && odoVal >= 0
        ? `${formatIntWithSpaces(odoVal)} ${t('km')}`
        : `-- ${t('km')}`;
    }
    if (fuelAvgEl) fuelAvgEl.textContent = formatTruckFuelAvg(data.fuelAvg, speedKmh);
    if (tempsEl) tempsEl.textContent = formatOilWaterTemps(data.oilTemp, data.waterTemp);
    if (airEl) airEl.textContent = formatAirPressure(data.air);
    if (adblueEl) adblueEl.textContent = formatAdblueLiters(data.adblue);
    if (batteryEl) batteryEl.textContent = formatBatteryVoltage(data.battery);
    if (rangeEl) rangeEl.textContent = formatFuelRangeKm(rawRange);

    const tripStats = resolveTripStats(data, speedMult);
    updateTickerValues({
      income: jobState.incomeText,
      companies: jobState.companiesText,
      jobType: jobState.jobTypeText,
      driven: tripStats.drivenText,
      liters: tripStats.litersText,
      avg: tripStats.avgText,
      maxSpeed: tripStats.maxSpeedText
    });

    applyGameStatusBadge(data, false, gameId, jobState.hasJob);

    latestJobStateSnapshot = jobState;
    latestIdentitySnapshot = identity;

    // Гарантированный State Fallback завершения/отмены рейса (DLC Coaches и грузовики)
    const isJobActive = Boolean(
      jobState && jobState.hasJob && !jobState.isGpsRoute &&
      (jobState.plannedKm > 0 || (jobState.text && jobState.text !== t('freeRoam')))
    );

    const navMeters = resolveNavDistanceMeters(navInputs.navDist, apiCfg);
    const navKm = navMeters !== null ? navMeters / 1000 : null;

    if (wasJobActive && !isJobActive) {
      const now = Date.now();
      const hasRecentPluginEvent = (now - lastJobDeliveredOrCancelledAt <= 2000);

      if (!hasRecentPluginEvent) {
        const snap = lastActiveJobSnapshot;
        const remKm = snap ? snap.remainingKm : null;
        const lastSpeed = snap ? snap.speedKmh : speedKmh;
        const isBus = snap ? snap.isBusJob : false;

        const isDelivered = (remKm !== null && remKm <= 3.0) || lastSpeed < 2.0;

        if (isDelivered) {
          const deliveredAmount = (snap && snap.income) ? snap.income : 0;
          const fallbackEvent = {
            seq: now,
            type: 'job_delivered',
            amount: deliveredAmount,
            xp: isBus ? 450 : 600,
            isBusJob: isBus,
            title: isBus
              ? t('eventBusJobDeliveredTitle')
              : t('eventJobDeliveredTitle'),
            category: isBus
              ? t('eventCategoryBusStop')
              : t('eventCategoryJobDelivered')
          };
          lastJobDeliveredOrCancelledAt = now;
          handleIncomingTelemetryEvent(fallbackEvent);
        } else {
          const fallbackCancel = {
            seq: now,
            type: 'job_cancelled',
            amount: 0,
            isBusJob: isBus,
            title: isBus
              ? t('eventBusJobCancelledTitle')
              : t('eventJobCancelledTitle'),
            category: isBus
              ? t('eventCategoryBusStop')
              : t('eventCategoryJobCancelled')
          };
          lastJobDeliveredOrCancelledAt = now;
          handleIncomingTelemetryEvent(fallbackCancel);
        }
      }

      wasJobActive = false;
      lastActiveJobSnapshot = null;
    }

    if (isJobActive) {
      wasJobActive = true;
      lastActiveJobSnapshot = {
        isBusJob: Boolean(jobState.isBusJob),
        routeText: jobState.routeText || jobState.text || '',
        plannedKm: jobState.plannedKm || 0,
        income: jobState.income || 0,
        remainingKm: navKm,
        speedKmh: speedKmh,
        timestamp: Date.now()
      };
    }

    if (speedKmh > sessionStats.maxSpeed) {
      sessionStats.maxSpeed = speedKmh;
    }
    const currentOdo = parseFiniteTelemetryNumber(data.tripDriven ?? (data.trip && data.trip.driven) ?? data.driven);
    if (currentOdo && currentOdo > sessionStats.kmDriven) {
      sessionStats.kmDriven = Math.round(currentOdo);
    }

    const currentFuel = Number(data.fuel);
    if (Number.isFinite(currentFuel) && currentFuel > 0) {
      checkRefuelProgress(currentFuel, speedKmh);
      checkLowFuelWarning(currentFuel, data);
    }

    checkCargoAndDamageEvents(data, speedKmh);
    checkBusEvents(data, isJobActive);

    const lastEvent = data.lastEvent || (data.tel && data.tel.lastEvent);
    if (lastEvent) {
      handleIncomingTelemetryEvent(lastEvent);
    }
  }

  /* ==========================================================================
     ОПРОС ЛОКАЛЬНОГО HTTP-МОСТА И ЗАЩИТА ОТ ЗАЛИПАНИЯ
     ========================================================================== */
  function resolvePacketAgeMs(data, ageHeader) {
    if (data && data.ageMs !== undefined && data.ageMs !== null && data.ageMs !== '') {
      const bodyAge = Number(data.ageMs);
      if (Number.isFinite(bodyAge)) return bodyAge;
    }
    if (ageHeader !== null && ageHeader !== '') {
      const hdrAge = Number(ageHeader);
      if (Number.isFinite(hdrAge)) return hdrAge;
    }
    if (data && data.updatedAtMs !== undefined && data.updatedAtMs !== null) {
      const updatedAt = Number(data.updatedAtMs);
      if (Number.isFinite(updatedAt) && updatedAt > 0) {
        return Math.max(0, Date.now() - updatedAt);
      }
    }
    return null;
  }

  function mergeTelemetryFields(packet, fallbackPacket) {
    if (!fallbackPacket || typeof fallbackPacket !== 'object') {
      return { ...packet };
    }
    const merged = { ...packet };
    TELEMETRY_RETAIN_KEYS.forEach((key) => {
      if (merged[key] === undefined && fallbackPacket[key] !== undefined) {
        merged[key] = fallbackPacket[key];
      }
    });
    return merged;
  }

  function unwrapTelemetryPayload(raw) {
    if (!raw || typeof raw !== 'object') return raw;
    if (!raw.tel || typeof raw.tel !== 'object') return raw;

    const merged = {
      ...(raw.srv && typeof raw.srv === 'object' ? { srv: raw.srv } : {}),
      ...(raw.trip && typeof raw.trip === 'object' ? { trip: raw.trip } : {}),
      ...(raw.cfg && typeof raw.cfg === 'object' ? { cfg: raw.cfg } : {}),
      ...raw.tel
    };
    if (raw.ok !== undefined) merged.ok = raw.ok;
    if (raw.connected !== undefined) merged.connected = raw.connected;
    if (raw.updatedAtMs !== undefined && merged.updatedAtMs === undefined) {
      merged.updatedAtMs = raw.updatedAtMs;
    }
    if (raw.ageMs !== undefined && merged.ageMs === undefined) {
      merged.ageMs = raw.ageMs;
    }
    if (raw.game !== undefined && merged.game === undefined) {
      merged.game = raw.game;
    }
    if (raw.paused !== undefined && merged.paused === undefined) {
      merged.paused = raw.paused;
    }
    if (raw.lastEvent !== undefined && merged.lastEvent === undefined) {
      merged.lastEvent = raw.lastEvent;
    }

    if (raw.cfg && typeof raw.cfg === 'object') {
      const cfgTruck = raw.cfg.truck && typeof raw.cfg.truck === 'object' ? raw.cfg.truck : null;
      const cfgBrand = (cfgTruck && cfgTruck.brand) ?? raw.cfg['truck.brand'] ?? raw.cfg.truckBrand;
      const cfgName = (cfgTruck && cfgTruck.name) ?? raw.cfg['truck.name'] ?? raw.cfg.truckName;
      const cfgPlate = (cfgTruck && cfgTruck.license && cfgTruck.license.plate) ??
        (cfgTruck && cfgTruck.licensePlate) ??
        raw.cfg['truck.license.plate'] ??
        raw.cfg.licensePlate;
      if (merged.truckBrand === undefined && cfgBrand !== undefined) merged.truckBrand = cfgBrand;
      if (merged.truckName === undefined && cfgName !== undefined) merged.truckName = cfgName;
      if (merged.licensePlate === undefined && cfgPlate !== undefined) merged.licensePlate = cfgPlate;
    }

    [
      'sourceCity', 'sourceCompany', 'destinationCity', 'destinationCompany',
      'cargoMassKg', 'plannedDistanceKm', 'income', 'jobMarket', 'scale',
      'tripDriven', 'tripLiters', 'tripAvg', 'tripMaxSpeed',
      'busSat', 'restStop', 'electric', 'engine', 'sourceStop', 'destinationStop', 'isBusJob'
    ].forEach((key) => {
      if (raw[key] !== undefined && merged[key] === undefined) {
        merged[key] = raw[key];
      }
    });

    return merged;
  }

  function hasTelemetryPluginFields(data) {
    return Boolean(
      data && typeof data === 'object' &&
      data.ok !== false &&
      data.connected !== false &&
      !data._offline && (
        data.speed !== undefined ||
        data.rpm !== undefined ||
        data.engineRpm !== undefined ||
        data.gear !== undefined ||
        data.dgear !== undefined ||
        data.displayedGear !== undefined ||
        data.fuel !== undefined ||
        data.fuelRange !== undefined ||
        data.odometer !== undefined ||
        data.fuelAvg !== undefined ||
        data.oilTemp !== undefined ||
        data.waterTemp !== undefined ||
        data.air !== undefined ||
        data.adblue !== undefined ||
        data.battery !== undefined ||
        data.wEngine !== undefined ||
        data.wTrans !== undefined ||
        data.wChassis !== undefined ||
        data.wWheels !== undefined ||
        data.wCabin !== undefined ||
        data.wTrailer !== undefined ||
        data.parkBrake !== undefined ||
        data.lowBeam !== undefined ||
        data.blinkL !== undefined ||
        data.blinkR !== undefined ||
        data.truckBrand !== undefined ||
        data.truckName !== undefined ||
        data.navDist !== undefined ||
        data.navTime !== undefined ||
        data.trailer !== undefined ||
        data.trailerOld !== undefined ||
        data.cargoDmg !== undefined ||
        data.jobDmg !== undefined ||
        hasMeaningfulCargoOrJob(data.cargo) ||
        hasMeaningfulCargoOrJob(data.cfg) ||
        hasMeaningfulCargoOrJob(data.trip)
      )
    );
  }

  function canHoldPreviousTelemetry(staleAfterMs, nowMs = Date.now()) {
    return Boolean(
      lastValidTelemetryPacket &&
      lastFreshTelemetryAt > 0 &&
      (nowMs - lastFreshTelemetryAt) < staleAfterMs
    );
  }

  function scheduleNextTelemetryPoll(delayMs) {
    if (isPageClosed) return;
    if (telemetryTimer !== null) {
      clearTimeout(telemetryTimer);
      telemetryTimer = null;
    }
    telemetryTimer = setTimeout(pollETS2Telemetry, delayMs);
  }

  async function pollETS2Telemetry() {
    if (isPageClosed || telemetryPollInFlight) return;

    const api = config.ets2 && config.ets2.telemetryApi;
    if (!api || !api.enabled || !api.url) {
      showTelemetryStandby();
      return;
    }

    if (global.document.hidden) {
      scheduleNextTelemetryPoll(1500);
      return;
    }

    const activeIntervalMs = Math.max(150, Number(api.pollIntervalMs) || 300);
    const staleAfterMs = Math.max(
      MIN_TELEMETRY_STALE_MS,
      Number(api.staleAfterMs) || DEFAULT_TELEMETRY_STALE_MS
    );
    const offlineBackoffMaxMs = Math.max(3000, Number(api.offlineBackoffMaxMs) || 15000);
    const fetchTimeoutMs = Math.max(2000, activeIntervalMs + 1700);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fetchTimeoutMs);
    telemetryPollInFlight = true;
    let nextPollDelayMs = activeIntervalMs;

    try {
      const res = await fetch(api.url, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const ageHeader = res.headers.get('X-Telemetry-Age-Ms');
      const rawData = await res.json();
      if (isPageClosed) return;

      const data = unwrapTelemetryPayload(rawData);
      const nowMs = Date.now();
      const packetAgeMs = resolvePacketAgeMs(data, ageHeader);
      const isExplicitDisconnected = Boolean(
        !data ||
        typeof data !== 'object' ||
        data.ok === false ||
        data.connected === false ||
        data._offline === true
      );
      const hasPluginFields = !isExplicitDisconnected && hasTelemetryPluginFields(data);
      const isBridgeUninitialized = isExplicitDisconnected || (packetAgeMs !== null && packetAgeMs < 0);
      const isPacketExpired = packetAgeMs !== null && packetAgeMs > staleAfterMs;

      if (hasPluginFields && !isBridgeUninitialized && !isPacketExpired) {
        telemetryMissCount = 0;
        bridgeOfflineNotified = false;

        const effectiveAgeMs = packetAgeMs !== null ? Math.max(0, packetAgeMs) : 0;
        lastFreshTelemetryAt = nowMs - effectiveAgeMs;

        if (!hasEverReceivedLivePacket) {
          stickySpeedUnit = null;
          lastValidTelemetryPacket = null;
        }

        const mergedPacket = mergeTelemetryFields(data, lastValidTelemetryPacket);
        lastValidTelemetryPacket = mergedPacket;
        hasEverReceivedLivePacket = true;

        renderTelemetryPacket(mergedPacket);
        showLiveTelemetry();
        nextPollDelayMs = activeIntervalMs;
      } else if (isExplicitDisconnected) {
        telemetryMissCount = 0;
        lastFreshTelemetryAt = 0;
        lastValidTelemetryPacket = null;
        if (!isTestMode || hasEverReceivedLivePacket) {
          showTelemetryStandby();
        }
        nextPollDelayMs = 1000;
      } else if (!isPacketExpired && canHoldPreviousTelemetry(staleAfterMs, nowMs)) {
        telemetryMissCount = 0;
        showLiveTelemetry();
        nextPollDelayMs = activeIntervalMs;
      } else {
        telemetryMissCount = 0;
        if (isPacketExpired) {
          lastFreshTelemetryAt = 0;
        }
        if (!isTestMode || hasEverReceivedLivePacket) {
          showTelemetryStandby();
        }
        nextPollDelayMs = 1000;
      }
    } catch (_) {
      if (isPageClosed) return;

      const nowMs = Date.now();
      if (canHoldPreviousTelemetry(staleAfterMs, nowMs)) {
        showLiveTelemetry();
        nextPollDelayMs = Math.max(activeIntervalMs, Math.min(800, activeIntervalMs + 200));
      } else {
        telemetryMissCount += 1;

        if (!bridgeOfflineNotified) {
          bridgeOfflineNotified = true;
          log('Мост телеметрии не запущен — отображаются прочерки ожидания, переход в тихий режим опроса.');
        }

        if (!isTestMode || hasEverReceivedLivePacket) {
          showTelemetryStandby();
        }

        nextPollDelayMs = Math.min(
          offlineBackoffMaxMs,
          Math.round(1500 * Math.pow(2, Math.min(telemetryMissCount - 1, 4)))
        );
      }
    } finally {
      clearTimeout(timeoutId);
      telemetryPollInFlight = false;
      if (!isPageClosed) {
        scheduleNextTelemetryPoll(global.document.hidden ? 1500 : nextPollDelayMs);
      }
    }
  }

  async function pollMusicApi() {
    const music = config.music;
    if (!music || !music.enabled || !music.sourceUrl || app.isPlaceholder(music.sourceUrl)) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1100);
    try {
      const res = await fetch(music.sourceUrl, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      const title = data.title || music.title;
      const artist = Array.isArray(data.artists) ? data.artists.join(', ') : (data.artist || '');
      const playing = data.status ? data.status === 'playing' : true;
      setTrackDisplay(title, artist, playing);
    } catch (_) {
      // Музыкальный локальный сервер недоступен — сохраняем статическое отображение
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function startTestMode() {
    log('Активирован тестовый режим (?test=1).');

    const driverFromConfig = config.ets2 && config.ets2.driverName;
    if (!driverFromConfig || driverFromConfig === 'DRIVER') {
      updateDriverLabels('FOOZZEE');
    }

    setTrackDisplay('Midnight Highway', 'FM-84', true);

    renderTelemetryPacket(SAMPLE_TELEMETRY_PACKET);
    showLiveTelemetry();

    const configuredSocials = config.socials && Array.isArray(config.socials.items)
      ? config.socials.items.filter((i) => i && !app.isPlaceholder(i.value))
      : [];
    if (configuredSocials.length === 0) {
      renderSocials([
        { label: 'ROUTE', value: 'A2 AUTOBAHN // NO DAMAGE' },
        { label: 'RADIO', value: 'TRUCKERS FM · CH 19' }
      ]);
    }

    if (app.chat) {
      SAMPLE_CHAT_POOL.forEach((msg) => app.chat.push(msg));
    }

    if (app.alerts) {
      demoTimers.push(setTimeout(() => {
        app.alerts.enqueue(SAMPLE_ALERTS.donate);
      }, 650));

      demoTimers.push(setTimeout(() => {
        app.alerts.enqueue(SAMPLE_ALERTS.sub);
      }, 1250));
    }

    console.info(
      '%c[ETS2 OVERLAY // TEST MODE]%c Доступные консольные команды:\n' +
      "  testAlert('donate' | 'sub' | 'follow' | 'raid' | 'all')\n" +
      '  testChat(count)\n' +
      '  testTelemetry({ speed: 24, dgear: "D12" }) / testTelemetry(false)\n' +
      "  testTrack('Название', 'Исполнитель')\n" +
      "  testRoute('Маршрут', '85 КМ/Ч', 'ETS2')\n" +
      "  setCockpitTheme('amber' | 'ice')\n" +
      '  setWebcamAspect("4:3" | "16:9")\n' +
      '  toggleWebcam(true | false)\n' +
      '  toggleGuides(true | false)',
      'color: #ff9e1b; font-weight: bold;',
      'color: inherit;'
    );
  }

  function registerConsoleCommands() {
    global.testAlert = function testAlert(type = 'donate', overrides = {}) {
      if (!app.alerts) return false;
      if (type === 'all') {
        ['donate', 'sub', 'follow', 'raid'].forEach((kind) => {
          app.alerts.enqueue({ ...SAMPLE_ALERTS[kind], ...overrides, type: kind, force: true });
        });
        return true;
      }
      const preset = SAMPLE_ALERTS[type] || SAMPLE_ALERTS.donate;
      return app.alerts.enqueue({ ...preset, ...overrides, type: preset.type, force: true });
    };

    let chatSampleIdx = 0;
    global.testChat = function testChat(count = 1, customText = null) {
      if (!app.chat) return 0;
      const total = Math.max(1, Math.min(30, Number(count) || 1));
      let pushed = 0;
      for (let i = 0; i < total; i += 1) {
        const sample = SAMPLE_CHAT_POOL[chatSampleIdx % SAMPLE_CHAT_POOL.length];
        chatSampleIdx += 1;
        const ok = app.chat.push({
          ...sample,
          text: customText ? String(customText) : sample.text
        });
        if (ok) pushed += 1;
      }
      return pushed;
    };

    global.testTelemetry = function testTelemetry(payload = {}) {
      if (payload === false) {
        lastValidTelemetryPacket = null;
        lastFreshTelemetryAt = 0;
        showTelemetryStandby();
        return false;
      }
      const merged = typeof payload === 'object' && payload !== null
        ? { ...SAMPLE_TELEMETRY_PACKET, ...payload }
        : SAMPLE_TELEMETRY_PACKET;
      stickySpeedUnit = null;
      renderTelemetryPacket(merged);
      showLiveTelemetry();
      return true;
    };

    global.testTrack = function testTrack(title = 'Nightcall', artist = 'Kavinsky', isPlaying = true) {
      setTrackDisplay(title, artist, isPlaying);
    };

    global.testRoute = function testRoute(text = 'Мюнхен → Вена', meta = '88 КМ/Ч', tag = 'ETS2 // ATS') {
      setRouteDisplay(text, meta, tag);
    };

    global.setCockpitTheme = function setCockpitTheme(preset = 'amber') {
      app.applyThemeVariables(preset);
    };

    global.setWebcamAspect = function setWebcamAspect(aspect = '4:3') {
      if (typeof app.setWebcamAspect === 'function') {
        return app.setWebcamAspect(aspect);
      }
      return aspect;
    };

    global.setSpeedUnit = function setSpeedUnit(unit = 'auto') {
      const normalized = String(unit || 'auto').trim().toLowerCase();
      forcedSpeedDisplayUnit = (normalized === 'mph' || normalized === 'kmh') ? normalized : null;
      if (lastValidTelemetryPacket) {
        renderTelemetryPacket(lastValidTelemetryPacket);
      } else if (isTestMode && !hasEverReceivedLivePacket) {
        renderTelemetryPacket(SAMPLE_TELEMETRY_PACKET);
      }
      return forcedSpeedDisplayUnit || 'auto';
    };

    global.toggleWebcam = function toggleWebcam(forceState) {
      const camBox = global.document.getElementById('cam-box');
      if (!camBox) return false;
      const nextVisible = typeof forceState === 'boolean'
        ? forceState
        : camBox.classList.contains('is-hidden');
      applyWebcamState(nextVisible);
      return nextVisible;
    };

    global.toggleGuides = function toggleGuides(forceState) {
      const next = typeof forceState === 'boolean'
        ? forceState
        : !global.document.body.classList.contains('show-guides');
      global.document.body.classList.toggle('show-guides', next);
      return next;
    };
  }

  function stopAllTimers() {
    isPageClosed = true;
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
    if (telemetryTimer) { clearTimeout(telemetryTimer); telemetryTimer = null; }
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (socialsTimer) { clearInterval(socialsTimer); socialsTimer = null; }
    if (leavingTimer) { clearTimeout(leavingTimer); leavingTimer = null; }
    demoTimers.forEach((id) => clearTimeout(id));
    demoTimers = [];
  }

  function checkOverlayUpdates() {
    const etsCfg = config.ets2 || {};
    const checkUpdates =
      config.checkUpdates === true &&
      etsCfg.checkUpdates !== false &&
      !/^test_/i.test(OVERLAY_VERSION);
    if (!checkUpdates) return;

    function parseSemver(v) {
      if (!v) return [0, 0, 0];
      const clean = String(v).replace(/^v/i, '').trim();
      const parts = clean.split('.').map((n) => parseInt(n, 10) || 0);
      while (parts.length < 3) parts.push(0);
      return parts;
    }

    function isNewerVersion(remote, local) {
      const r = parseSemver(remote);
      const l = parseSemver(local);
      for (let i = 0; i < 3; i++) {
        if (r[i] > l[i]) return true;
        if (r[i] < l[i]) return false;
      }
      return false;
    }

    try {
      const now = Date.now();
      let cached = null;
      try {
        const raw = global.localStorage.getItem(UPDATE_CACHE_KEY);
        if (raw) cached = JSON.parse(raw);
      } catch (_) {}

      if (cached && (now - cached.timestamp < UPDATE_CACHE_TTL_MS) && cached.tag_name) {
        if (isNewerVersion(cached.tag_name, OVERLAY_VERSION)) {
          enqueueTelemetryEvent({
            seq: Date.now(),
            type: 'update',
            version: cached.tag_name
          });
        }
        return;
      }

      fetch('https://api.github.com/repos/FooZzee/stream-overlay-cockpit/releases/latest', {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      })
        .then((res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .then((data) => {
          if (!data || !data.tag_name) return;
          try {
            global.localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify({
              tag_name: data.tag_name,
              timestamp: Date.now()
            }));
          } catch (_) {}

          if (isNewerVersion(data.tag_name, OVERLAY_VERSION)) {
            enqueueTelemetryEvent({
              seq: Date.now(),
              type: 'update',
              version: data.tag_name
            });
          }
        })
        .catch(() => {});
    } catch (_) {}
  }

  function bootstrap() {
    applyLocalization();
    applyWebcamState(!config.webcam || config.webcam.enabled !== false);
    updateDriverLabels();
    updateDashboardSocials();
    showTelemetryStandby();

    if (config.ets2 && !(config.ets2.telemetryApi && config.ets2.telemetryApi.enabled)) {
      setRouteDisplay(config.ets2.routeText, config.ets2.routeMeta, config.ets2.routeTag);
    }

    if (config.music) {
      setTrackDisplay(config.music.title, config.music.artist, true);
    }

    renderSocials(config.socials ? config.socials.items : []);
    updateClock();

    if (showGuides) {
      global.document.body.classList.add('show-guides');
    }

    clockTimer = setInterval(updateClock, 1000);

    if (config.music && config.music.sourceUrl && !app.isPlaceholder(config.music.sourceUrl)) {
      const interval = Math.max(1000, Number(config.music.pollIntervalMs) || 3000);
      pollMusicApi();
      musicTimer = setInterval(pollMusicApi, interval);
    }

    if (app.chat) {
      app.chat.initConnections();
    }

    registerConsoleCommands();

    if (isTestMode) {
      startTestMode();
    }

    if (config.ets2 && config.ets2.telemetryApi && config.ets2.telemetryApi.enabled) {
      pollETS2Telemetry();
    }

    if (config.checkUpdates === true && !/^test_/i.test(OVERLAY_VERSION)) {
      setTimeout(checkOverlayUpdates, 3000);
    }
  }

  global.addEventListener('DOMContentLoaded', bootstrap);
  global.addEventListener('visibilitychange', () => {
    if (!global.document.hidden) {
      updateClock();
      if (config.ets2 && config.ets2.telemetryApi && config.ets2.telemetryApi.enabled) {
        telemetryMissCount = 0;
        if (!telemetryPollInFlight) {
          scheduleNextTelemetryPoll(50);
        }
      }
    }
  });
  global.addEventListener('pagehide', stopAllTimers);
})(window);
