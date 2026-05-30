// i18n — lightweight translation system
const locales = {
  en: {
    // Nav
    'nav.events': 'Events',
    'nav.leaderboard': 'Leaderboard',
    'nav.reset': 'Reset',

    // Dashboard
    'dashboard.title': 'Polymarket Fantasy',
    'dashboard.subtitle': 'Predict events with play money. Compete with friends.',
    'dashboard.search': 'Search events…',
    'dashboard.active_events': 'active events',
    'dashboard.live': 'Live',
    'dashboard.sort': 'Sort:',
    'dashboard.sort_volume': 'Volume',
    'dashboard.sort_end_date': 'End Date',
    'dashboard.sort_price': 'Price',
    'dashboard.sort_spread': 'Spread',
    'dashboard.no_events': 'No events found.',
    'dashboard.prev': '← Prev',
    'dashboard.next': 'Next →',

    // Event Detail
    'event.detail.back': '← Back',
    'event.detail.resolved': 'Event Resolved',
    'event.detail.winner': 'Winner',

    // Betting
    'bet.place': 'Place Your Bet',
    'bet.place_bet': 'Bet',
    'bet.amount': 'Amount ($ play money)',
    'bet.your_bets': 'Your Bets',
    'bet.placing': 'Placing…',

    // Profile
    'profile.title': 'Profile',
    'profile.stats': 'Stats',
    'profile.balance': 'Balance',
    'profile.total_bets': 'Total Bets',
    'profile.win_rate': 'Win Rate',
    'profile.won': 'won',
    'profile.lost': 'lost',
    'profile.pending': 'pending',
    'profile.nickname': 'Nickname',
    'profile.save': 'Save',
    'profile.email_login': 'Email Login',
    'profile.email_hint': 'Link your email for persistent access',
    'profile.send_code': 'Send Code',
    'profile.verify': 'Verify',
    'profile.enter_code': 'Enter code',
    'profile.code_hint': 'Your verification code:',
    'profile.nickname_taken': 'This nickname is already taken.',

    // Leaderboard
    'lb.title': 'Leaderboard',
    'lb.subtitle': 'Top predictors by profit',
    'lb.rank': '#',
    'lb.player': 'Player',
    'lb.profit': 'Profit',
    'lb.balance': 'Balance',
    'lb.bets': 'Bets',
    'lb.win_rate': 'Win Rate',
    'lb.roi': 'ROI',
    'lb.empty': 'No bets yet — be the first!',

    // Errors
    'error.generic': 'Something went wrong',
    'error.network': 'Network error. Please try again.',
  },

  ru: {
    // Nav
    'nav.events': 'События',
    'nav.leaderboard': 'Лидерборд',
    'nav.reset': 'Сброс',

    // Dashboard
    'dashboard.title': 'Polymarket Fantasy',
    'dashboard.subtitle': 'Предсказывайте события на фантики. Соревнуйтесь с друзьями.',
    'dashboard.search': 'Поиск событий…',
    'dashboard.active_events': 'активных событий',
    'dashboard.live': 'Вживую',
    'dashboard.sort': 'Сортировка:',
    'dashboard.sort_volume': 'Объём',
    'dashboard.sort_end_date': 'Дата',
    'dashboard.sort_price': 'Цена',
    'dashboard.sort_spread': 'Спред',
    'dashboard.no_events': 'Событий не найдено.',
    'dashboard.prev': '← Назад',
    'dashboard.next': 'Вперёд →',

    // Event Detail
    'event.detail.back': '← Назад',
    'event.detail.resolved': 'Событие завершено',
    'event.detail.winner': 'Победитель',

    // Betting
    'bet.place': 'Сделать ставку',
    'bet.place_bet': 'Ставка',
    'bet.amount': 'Сумма ($ фантики)',
    'bet.your_bets': 'Ваши ставки',
    'bet.placing': 'Размещаем…',

    // Profile
    'profile.title': 'Профиль',
    'profile.stats': 'Статистика',
    'profile.balance': 'Баланс',
    'profile.total_bets': 'Всего ставок',
    'profile.win_rate': 'Винрейт',
    'profile.won': 'выиграно',
    'profile.lost': 'проиграно',
    'profile.pending': 'в ожидании',
    'profile.nickname': 'Никнейм',
    'profile.save': 'Сохранить',
    'profile.email_login': 'Вход по email',
    'profile.email_hint': 'Привяжите email для доступа к аккаунту',
    'profile.send_code': 'Выслать код',
    'profile.verify': 'Подтвердить',
    'profile.enter_code': 'Введите код',
    'profile.code_hint': 'Ваш код подтверждения:',
    'profile.nickname_taken': 'Этот ник уже занят.',

    // Leaderboard
    'lb.title': 'Лидерборд',
    'lb.subtitle': 'Лучшие игроки по профиту',
    'lb.rank': '#',
    'lb.player': 'Игрок',
    'lb.profit': 'Прибыль',
    'lb.balance': 'Баланс',
    'lb.bets': 'Ставки',
    'lb.win_rate': 'Винрейт',
    'lb.roi': 'ROI',
    'lb.empty': 'Пока нет ставок — будьте первым!',

    // Errors
    'error.generic': 'Что-то пошло не так',
    'error.network': 'Ошибка сети. Попробуйте снова.',
  },
}

export type Locale = keyof typeof locales
export type TKey = keyof typeof locales.en

const _locales = locales as Record<string, Record<string, string>>

export function t(key: TKey, locale: Locale = 'en'): string {
  return _locales[locale]?.[key as string] || _locales['en']?.[key as string] || key
}

export function getLocales(): Locale[] {
  return Object.keys(locales) as Locale[]
}

export function getLocaleLabel(locale: Locale): string {
  switch (locale) {
    case 'en': return 'English'
    case 'ru': return 'Русский'
    default: return locale
  }
}
