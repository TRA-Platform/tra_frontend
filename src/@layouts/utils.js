export const openGroups = ref([])

/**
 * Return nav link props to use
 * @param {Object, String} item navigation routeName or route Object provided in navigation data
 */
export const getComputedNavLinkToProp = computed(() => link => {
  const props = {
    target: link.target,
    rel: link.rel,
  }


  // If route is string => it assumes string is route name => Create route object from route name
  // If route is not string => It assumes it's route object => returns passed route object
  if (link.to)
    props.to = typeof link.to === 'string' ? { name: link.to } : link.to
  else
    props.href = link.href

  return props
})

/**
 * Return route name for navigation link
 * If link is string then it will assume it is route-name
 * IF link is object it will resolve the object and will return the link
 * @param {Object, String} link navigation link object/string
 */
export const resolveNavLinkRoute = (link, router) => {
  if (!link.to)
    return null
  if (typeof link.to === 'string')
    return link.to

  return router.resolve(link.to).name
}

/**
 * Check if nav-link is active
 * @param {Object} link nav-link object
 */
export const isNavLinkActive = (link, router) => {
  // Matched routes array of current route
  const matchedRoutes = router.currentRoute.value.matched

  // Check if provided route matches route's matched route
  const resolveRouted = resolveNavLinkRoute(link, router)
  if (!resolveRouted || !resolveRouted.name)
    return false

  return matchedRoutes.some(route => {
    return (route.name === resolveRouted.name && (!link.params || (resolveRouted.params === link.params))) || route.meta.navActiveLink === resolveRouted.name
  })
}

/**
 * Check if nav group is active
 * @param {Array} children Group children
 */
export const isNavGroupActive = (children, router) => children.some(child => {
  // If child have children => It's group => Go deeper(recursive)
  if ('children' in child) {
    // console.log(`${JSON.stringify(child)} - ${isActive}`)

    return isNavGroupActive (child.children, router)
  }

  // else it's link => Check for matched Route
  // console.log(`${JSON.stringify(child)} - ${isActive}`)

  return isNavLinkActive(child, router)
})

/**
 * Convert Hex color to rgb
 * @param hex
 */
export const hexToRgb = hex => {
  // Expand shorthand refForm (e.g. "03F") to full refForm (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i

  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b
  })

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

  return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : null
}

/**
 ** RGBA color to Hex color with / without opacity
 */
export const rgbaToHex = (rgba, forceRemoveAlpha = false) => {
  return (`#${rgba
    .replace(/^rgba?\(|\s+|\)$/g, '') // Get's rgba / rgb string values
    .split(',') // splits them at ","
    .filter((string, index) => !forceRemoveAlpha || index !== 3)
    .map(string => parseFloat(string)) // Converts them to numbers
    .map((number, index) => (index === 3 ? Math.round(number * 255) : number)) // Converts alpha to 255 number
    .map(number => number.toString(16)) // Converts numbers to hex
    .map(string => (string.length === 1 ? `0${string}` : string)) // Adds 0 when length of one number is 1
    .join('')}`)
}
