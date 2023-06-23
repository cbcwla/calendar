import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'

import _ from 'lodash'
import { getPersonRoles, parseMdFile, YEAR, yearActivities } from './parseMd.js'
import {
  beforeActivityDateParser,
  duringActivityDateParser,
  parseActivityDate} from './dateParser.js'

/* NOTE Expected output is an array of event objects, like:
 * [{
 *   title: eventTitle
 *   start: startTime or startDate
 *   end: endTime or endTime
 *   tags: { activity, dept } 
 *   owners: []
 *   details: html
 * }]
 *
 * TODO: support repeat attribute
 *   repeat: { // optional
 *     until: end_date,
 *     frequency: enum('weekly', 'monthly')
 *     byday: 'SU' // 'SU': every sunday; '3SU': every 3rd sunday of the month; 'SU,WE': every sunday and wednesday
 *   } // convert to ics samples: "RRULE:FREQ=WEEKLY;WKST=SU;UNTIL=20230630;BYDAY=SU", "RRULE:FREQ=MONTHLY;UNTIL=20241231;BYDAY=3SU"
 */
const parseActivity = (activity, tree, roleExists) => {
  let tags = {
    activity: activity.type,
    dept: null
  }

  let title = null
  _.each(tree.children, (elem) => {
    if (elem.type === 'heading') {
      if (elem.depth === 2) {
        tags.dept = elem.children[0].value
      } else if (elem.depth === 3) {
        title = elem.children[0].value
        elem.title = title
        elem.tags = _.clone(tags)
      }
    } else {
      elem.title = title
    }
  })

  const eventsData = _.groupBy(_.filter(tree.children, 'title'), 'title')
  return _.map(eventsData, (elements, title) => {
    const attributes = _.map(elements, (elem) => {
      if (elem.type === 'heading') {
        return _.pick(elem, [ 'title', 'tags' ])
      } else if (elem.type === 'paragraph') {
        const text = elem.children[0].value
        const [key, value] = _.split(text, '：') 
        if (key ===  '時間') {
          const end = activity.end != null? activity.end:activity.start
          let result = eventDateParser(value, parseActivityDate(activity.start), parseActivityDate(end))
          console.log(result)
          return result
        } else if (key === '同工') {
          const owners = _.map(_.split(value, /[,， ]+/), (owner) => {
            const role = _.replace(owner, /^@/, '')
            const activityRoleName = _.compact([role, activity.id]).join('.')
            return roleExists[activityRoleName] ? activityRoleName : role
          })
          return { owners } 
        } else {
          return {}
        }
      } else {
        return { details: toHtml(toHast(elem)) }
      }
    })
    const ev = _.merge(...attributes)
    return _.merge(ev, { id: `${ev.title}.${activity.id}` })
  })
}

const eventDateParser = (dateInfo, actStartDate, actEndDate) => {
  let res = { start: dateInfo, end: dateInfo}
  if(dateInfo.includes("提前")) {
    res = beforeActivityDateParser.parseEventDate(dateInfo, actStartDate, actEndDate)
  }
  else if(dateInfo.includes("活動") || dateInfo.includes("每")) {
    res = duringActivityDateParser.parseEventDate(dateInfo, actStartDate, actEndDate)
  }
  return res
}

const main = async () => {
  const activities = await yearActivities(YEAR)
  const personRoles = await getPersonRoles()
  console.log('export const roles = ', JSON.stringify(personRoles, null, 2))

  const roleExists = _.fromPairs(_.map(_.uniq(_.flatten(_.values(personRoles))), (role) => [role, true]))
  const events = _.flatten(await Promise.all(_.map(activities, async (activity) => {
    const tree = await parseMdFile(activity.type)
    return parseActivity(_.merge({ year: YEAR }, activity), tree, roleExists)
  })))
  console.log('export const events = ', JSON.stringify(events, null, 2))
}
main()

