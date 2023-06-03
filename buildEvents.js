import fs from 'node:fs/promises'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'

import _ from 'lodash'

const tableToArray = _.rest( (header, rows) => {
  const keys = _.map(header.children, 'children[0].value')
  return _.map(rows, (row) => {
    const pairs = _.map(row.children, (cell, idx) => [keys[idx], cell.children[0].value])
    return _.fromPairs(pairs)
  })
})

const activityHash = (array) => {
  const pairs = _.map(array, (activity) =>
    [activity.label, activity]
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

/* To parse relative date time description to a { start, end }
 *
 * @input
 * description: e.g. 提前12周-9周, 活動第1天下午3點-6點
 * dateRange: { start, end } of the activity, both date format
 *
 * @output
 * start and end of the event
 * {
 *   start: LocaleDateString
 *   end: LocaleDateString
 * }
 */
const parseDateTime = (description, dateRange) => {
  // TOOD @lupengwa (it doesn't have to be in regex)
  // parts:
  //   prefix: 提前, 活動第x天, 活動期間, 活動最後1天, 活動後
  //   range: x天-y天, x周-y天, x周-y周
  //   timeRange: x時-y時, 下午x時-y時

  var m
  if (m = description.match(/提前(\d+)周-(\d+)周/)) {
    const startWeek = parseInt(m[1])
    const endWeek = parseInt(m[2])
    const start = new Date()
    const end = new Date()
    start.setDate(dateRange.start.getDate() - startWeek * 7)
    end.setDate(dateRange.start.getDate() - endWeek * 7)
    return { start: start.toLocaleDateString(), end: end.toLocaleDateString() }

  } else {
    return { start: description, end: description }
  }
}

/* To parse one activity into a list of events
 *
 * @input
 * activity: object of { title, start, end, name }
 * tree: parsed raw tree from md
 *
 * @output 
 * [{
 *   title: eventTitle
 *   start: startTime or startDate
 *   end: endTime or endTime
 *   tags: { activity, dept } 
 *   groups: []
 *   details: html
 * }]
 */
const parseActivity = (activity, tree) => {
  // NOTE grouping elements
  let tags = {
    activity: activity.label,
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

  // NOTE convert each group to an event
  const activityDateRange = {
    start: new Date(`${activity.year}/${activity.start}`),
    end: new Date(`${activity.year}/${activity.end}`)
  }

  return _.map(eventsData, (elements, title) => {
    const attributes = _.map(elements, (elem) => {
      if (elem.type === 'heading') {
        return _.pick(elem, [ 'title', 'tags' ])
      } else if (elem.type === 'paragraph') {
        const text = elem.children[0].value
        const [key, value] = _.split(text, '：') 
        if (key ===  '時間') {
          return parseDateTime(value, activityDateRange)
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
  const tableRows = tree.children[0].children
  const array = tableToArray(...tableRows)
  return activityHash(array)
}

const main = async () => {
  const year = '2023'
  const activities = await yearActivities(year)
  const events = _.flatten(await Promise.all(_.map(activities, async (activity) => {
    const tree = await parseMdFile(activity.label)
    return parseActivity(_.merge({ year }, activity), tree)
  })))

  console.log(JSON.stringify(events, null, 2))
}
main()

