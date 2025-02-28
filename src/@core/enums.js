import i18n from '@/plugins/i18n/index'

const { t } = i18n.global
export const Skins = {
  Default: 'default',
  Bordered: 'bordered',
}
export const RouteTransitions = {
  Fade: 'app-transition-fade',
  None: 'none',

  // 'Zoom Fade': 'app-transition-zoom-fade',
  // 'Fade Bottom': 'app-transition-fade-bottom',
  // 'Slide Fade': 'app-transition-slide-fade',
  // 'Zoom out': 'app-transition-zoom-out',
}
export const ROLE_MAPPING = {
  "-1": {
    status: t ('roles.banned'),
    chip: { color: 'error' },
  },
  "9": {
    status: t ('roles.admin'),
    chip: { color: 'success' },
  },
}

