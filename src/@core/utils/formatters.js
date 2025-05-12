import {isToday} from './index'
import DOMPurify from "dompurify"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import i18n from '@/plugins/i18n/index'
import {
    ROLE_MAPPING,
} from "@core/enums"
import {Buffer} from "buffer";
import pako from "pako";
import plantUmlEncoder from 'plantuml-encoder'

const {t} = i18n.global

dayjs.extend(relativeTime)

export const formatDateBefore = dateString => {

    const currentDate = dayjs() // Assuming the current date and time is now
    const targetDate = dayjs(dateString)

    const diffInYears = currentDate.diff(targetDate, 'year')
    const diffInDays = currentDate.diff(targetDate, 'day')
    const diffInHours = currentDate.diff(targetDate, 'hour')
    const diffInMinutes = currentDate.diff(targetDate, 'minute')
    const diffInSeconds = currentDate.diff(targetDate, 'second')

    if (diffInDays > 0) {
        return targetDate.format("MMM D") + (diffInYears > 0 ? targetDate.format(" YYYY") : "")
    } else if (diffInHours > 0) {
        return `${diffInHours > 1 ? diffInHours.toString() + ' часов' : 'Час'} назад`
    } else if (diffInMinutes > 0) {
        return `${diffInMinutes > 1 ? diffInMinutes.toString() + ' минут' : 'Минуту'} назад`
    } else {
        return `${diffInSeconds > 1 ? diffInSeconds.toString() + ' секунд' : 'Секунду'} назад`
    }
}
export const splitArrayIntoParts = (arr, numParts) => {
    const len = arr.length
    const chunkSize = Math.ceil(len / numParts) // Round up to ensure each chunk has at least 1 element
    const result = []

    for (let i = 0; i < len; i += chunkSize) {
        result.push(arr.slice(i, i + chunkSize))
    }

    return result
}

export const avatarText = value => {
    if (!value)
        return ''
    const nameArray = value.split(' ')

    return nameArray.map(word => word.charAt(0).toUpperCase()).join('')
}

// TODO: Try to implement this: https://twitter.com/fireship_dev/status/1565424801216311297
export const kFormatter = num => {
    const regex = /\B(?=(\d{3})+(?!\d))/g

    return Math.abs(num) > 9999 ? `${Math.sign(num) * +((Math.abs(num) / 1000).toFixed(1))}k` : Math.abs(num).toFixed(0).replace(regex, ',')
}

/**
 * Format and return date in Humanize format
 * Intl docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/format
 * Intl Constructor: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
 * @param {String} value date to format
 * @param {Intl.DateTimeFormatOptions} formatting Intl object to format with
 */
export const formatDate = (value, formatting = {month: 'short', day: 'numeric', year: 'numeric'}) => {
    if (!value)
        return value

    return new Intl.DateTimeFormat('en-US', formatting).format(new Date(value))
}

/**
 * Return short human friendly month representation of date
 * Can also convert date to only time if date is of today (Better UX)
 * @param {String} value date to format
 * @param {Boolean} toTimeForCurrentDay Shall convert to time if day is today/current
 */
export const formatDateToMonthShort = (value, toTimeForCurrentDay = true) => {
    const date = new Date(value)
    let formatting = {month: 'short', day: 'numeric'}
    if (toTimeForCurrentDay && isToday(date))
        formatting = {hour: 'numeric', minute: 'numeric'}

    return new Intl.DateTimeFormat('en-US', formatting).format(new Date(value))
}
export const prefixWithPlus = value => value > 0 ? `+${value}` : value

export const toDays = (timestamp, delta = false) => {
    const now = Date.now() / 1000
    const difference = (!delta) ? (timestamp - now) : timestamp

    return parseInt(difference / (24 * 60 * 60))
}
export const toMonths = timestamp => {
    return toDays(timestamp / 30, true)
}
export const formatTimestamp = timestamp => {
    const options = {month: 'short', day: 'numeric', year: 'numeric'}

    return new Date(timestamp).toLocaleDateString('en-US', options)
}
export const roundToNDigits = (number, n) => {
    const factor = 10 ** n

    return Math.ceil(number * factor) / factor
}

export const capitalize = s => (s && s[0].toUpperCase() + s.slice(1).toLowerCase()) || ""

export const purify = text => {
    return DOMPurify.sanitize(text)
}
export const formatUUID = uuid => {
    if (!uuid)
        return ''

    return `${uuid.split('-').at(-1)}`
}

export const resolveRole = roleId => {
    const key = roleId.toString()

    return ROLE_MAPPING[key] || {
        status: t('roles.anonymous'),
        chip: {color: 'info'},
    }
}

export const formatTimeDelta = (startTime, endTime) => {
    const timeDelta = (endTime - startTime) / 1000
    const hours = Math.floor(timeDelta / 3600)
    const minutes = Math.floor((timeDelta % 3600) / 60)
    const seconds = Math.floor(timeDelta % 60)
    const formattedHours = String(hours).padStart(2, '0')
    const formattedMinutes = String(minutes).padStart(2, '0')

    // const formattedSeconds = String(seconds).padStart(2, '0')

    return `${formattedHours}:${formattedMinutes}`
}
export const formatTimeDeltaSeconds = (startTime, endTime) => {
    const timeDelta = (endTime - startTime) / 1000
    const hours = Math.floor(timeDelta / 3600)
    const minutes = Math.floor((timeDelta % 3600) / 60)
    const seconds = Math.floor(timeDelta % 60)
    const formattedHours = String(hours).padStart(2, '0')
    const formattedMinutes = String(minutes).padStart(2, '0')
    const formattedSeconds = String(seconds).padStart(2, '0')
    if (hours === 0) return `${formattedMinutes}:${formattedSeconds}`

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
}


export const getCategoryChipColor = (category) => {
    switch (category) {
        case 'functional':
            return 'primary'
        case 'nonfunctional':
            return 'secondary'
        case 'uiux':
            return 'success'
        case 'other':
            return 'info'
        default:
            return 'primary'
    }
}

export const getStatusChipColor = (status) => {
    switch (status) {
        case 'draft':
            return 'warning'
        case 'active':
            return 'success'
        case 'archived':
            return 'secondary'
        case 'completed':
            return 'info'
        default:
            return 'primary'
    }
}

export const renderUML = (content) => {
    // if (content) {
    //   const data = Buffer.from(content, 'utf8')
    //   const compressed = pako.deflate(data, { level: 9 })
    //   const result = Buffer.from(compressed)
    //     .toString('base64')
    //     .replace(/\+/g, '-').replace(/\//g, '_')
    //   // return `https://kroki.io/plantuml/svg/${result}`
    //   return `https://plantuml.com/plantuml/svg/~1${result}`
    // }
    if (content) {
        const encoded = plantUmlEncoder.encode(content)
        return `https://www.plantuml.com/plantuml/svg/${encoded}`
    }
    return ''
}
