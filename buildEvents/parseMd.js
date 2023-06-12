import fs from 'node:fs/promises'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import _ from 'lodash'

export const YEAR = 2023

export const parseMdFile = async (mdName) => {
  const doc = await fs.readFile(`docs/${mdName}.md`)

  return fromMarkdown(doc, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()]
  })
}

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

export const yearActivities = async (year) => {
  const tree = await parseMdFile(year)
  const tableRows = tree.children[1].children
  const array = tableToArray(...tableRows)
  return activityHash(array)
}

const parseRoles = async () => {
  const tree = await parseMdFile('roles')

  var inActivity = false
  var activityId = null
  const rows = _.flatten(_.compact(_.map(tree.children, (node) => {
    if (node.type === 'table') {
      var parsedRows = tableToArray(...node.children)
      if (activityId)
        parsedRows = _.map(parsedRows, (row) => _.merge(row, { activityId }))
      return parsedRows

    } else if (node.type === 'heading') {
      const headingText = _.get(node, 'children[0].value')
      if (node.depth === 2 && headingText === 'Activities')
        inActivity = true
      else if (node.depth === 3 && inActivity)
        activityId = headingText 
      else
        inActivity = false
    }
  })))

  const rolesHavePeople = _.omitBy(rows, (row) => row.people === '-')

  const roles = _.map(rolesHavePeople, (role) => {
    return _.merge(role, {people: _.split(role.people, /[,，]\s*/)})
  })

  return roles;
}

export const getPersonRoles = async () => {
  const roles = await parseRoles()
  const hash = {}
  _.each(roles, (role) => {
    _.each(role.people, (person) => {
      const key = _.toLower(person)
      const roleName = _.compact([role.role, role.activityId]).join('.')
      hash[key] ||= []
      hash[key].push(roleName)
    })
  })

  return hash
}
