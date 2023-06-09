import fs from 'node:fs/promises'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'

import _ from 'lodash'
import {beforeActivityDateParser, duringActivityDateParser, parseActivityDate} from "./dateParser.js";

const tableToArray = _.rest( (header, rows) => {
  const keys = _.map(header.children, 'children[0].value')
  return _.map(rows, (row) => {
    const pairs = _.map(row.children, (cell, idx) => [keys[idx], _.get(cell, 'children[0].value')])
    return _.fromPairs(pairs)
  })
})

const activityHash = (array) => {
  const pairs = _.map(array, (activity) =>
    [activity.id, activity]
  )
  return _.fromPairs(pairs)
}

const parseMdFile = async (mdName) => {
  const doc = await fs.readFile(`docs/${mdName}.md`)

  return fromMarkdown(doc, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()]
  })
}

/* NOTE Expected output is an array of event objects, like:
 * [{
 *   title: eventTitle
 *   start: startTime or startDate
 *   end: endTime or endTime
 *   tags: { activity, dept } 
 *   groups: []
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
const parseActivity = (activity, tree) => {
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
          let result = eventDateParser(value, parseActivityDate(activity.start), parseActivityDate(activity.end))
          return result
        } else if (key === '同工') {
          return { groups: _.split(value, ' ') }
        } else {
          return {}
        }
      } else {
        return { details: toHtml(toHast(elem)) }
      }
    })
    return _.merge(...attributes)
  })
}

const yearActivities = async (year) => {
  const tree = await parseMdFile(year)
  const tableRows = tree.children[1].children
  const array = tableToArray(...tableRows)
  return activityHash(array)
}

const eventDateParser = (dateInfo, actStartDate, actEndDate) => {
  let res = { start: dateInfo, end: dateInfo}
  if(dateInfo.includes("提前")) {
    res = beforeActivityDateParser.parseEventDate(dateInfo, actStartDate, actEndDate)
  }
  else if(dateInfo.includes("活動")) {
    res = duringActivityDateParser.parseEventDate(dateInfo, actStartDate, actEndDate)
  }
  return res
}

const main = async () => {
  const year = '2023'
  const activities = await yearActivities(year)
  const events = _.flatten(await Promise.all(_.map(activities, async (activity) => {
    const tree = await parseMdFile(activity.type)
    return parseActivity(_.merge({ year }, activity), tree)
  })))

  console.log(JSON.stringify(events, null, 2))
}
main()

