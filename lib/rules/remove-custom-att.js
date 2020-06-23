/**
 * @fileoverview QField should not be used to wrap QInput or QSelect
 * @author Jeff Galbraith <jeff@quasar.dev>
 */
'use strict'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Removing Custom Attributes',
      category: 'current',
      url: '', // url to docs
      recommended: true
    },
    fixable: 'whitespace',  // or "code" or "whitespace"
    schema: [
      // fill in your schema
    ],
    messages: {
      info1: `'{{ a }}' can be removed`,
      info2: `'{{ a }}' will be added {{ b }}`
    }
  },

  create: function (context) {
    const sourceCode = context.getSourceCode()
    // variables should be defined here

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------
    // any helper functions should go here or else delete this section
    const components = ['q-input', 'q-select'] // eligible components

    let remove = new Map([
      ['class', ['no-shadow', 'custom-input-border', 'relative-position']],
      ['color', ['white', 'text-black']]
    ])

    let add = new Map([
      ['global', ['outlined', 'dense']],
      ['q-select', ['emit-value', 'map-options', 'options-dense']]
    ])

    let replace = new Map([
      ['label', ['stack-label', 'float-label', 'placeholder']]
    ])

    function getComponet (element) {
      if (element.type === 'VElement') {
        if (components.includes(element.rawName)) {
          return {
            name: element.rawName,
            element: element
          }
        }
      }
    }

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return context.parserServices.defineTemplateBodyVisitor({
      VElement (node) {
        const tokens = context.parserServices.getTemplateBodyTokenStore()
        let collection = []
        let addLength = []
        let reports = []
        let component = getComponet(node)
        if (component) {
          let problems = []
          let attributes = component.element.startTag.attributes || []
          // Remove
          attributes.forEach((att) => {
            ;['class', 'color'].forEach((type) => {
              if (att.key.name === type) {
                const attValue = att.value.value
                const attSplit = attValue.split(' ')
                let difference = attSplit.filter(x => !remove.get(type).includes(x))
                let intersection = attSplit.filter(x => remove.get(type).includes(x))
                if (intersection.length > 0) {
                  reports.push(context.report({
                    messageId: 'info1',
                    data: {
                      a: component.name + ' ' + type + ' ' + remove.get(type)
                    },
                    node: node,
                    fix (fixer) {
                      if (difference.length > 0) {
                        return fixer.replaceText(att, `${type}="${difference}"`)
                      } else {
                        return fixer.remove(att)
                      }
                    }
                  }))
                }
              }
            })
            // Replace
            if (att.key.name &&
              replace.get('label').includes(att.key.name.name === 'bind' ? att.key.argument.name : att.key.name)) {
              reports.push(context.report({
                messageId: 'info2',
                data: {
                  a: component.name
                },
                node: node,
                fix (fixer) {
                  if (att.key) {
                    let value = sourceCode.getText(att.value)
                    let full = att.key.name.name === 'bind' ? `${att.key.name.rawName}label=${value}` : `label=${value}`
                    return fixer.replaceTextRange(att.range, full)
                  }
                }
              }))
            }
          })
          // Add
          if (add.get(component.name)) {
            collection = [...collection, ...add.get(component.name)]
          }

          collection = [...collection, ...add.get('global')]

          addLength = attributes.filter((x) => {
            return collection.includes(x.key.name)
          })

          if (addLength.length > 0) {
            addLength.forEach((add) => {
              let removeIndex = collection.findIndex((coll) => coll === add.key.name)
              collection.splice(removeIndex, 1)
            })
          }

          if (collection.length > 0) {
            reports.push(context.report({
              messageId: 'info2',
              data: {
                a: component.name,
                b: collection
              },
              node: node,
              fix (fixer) {
                const componentOpenTag = tokens.getFirstToken(component.element.startTag)
                let val = ' ' + collection.join(' ')
                return fixer.insertTextAfterRange(componentOpenTag.range, val)
              }
            }))
          }
        }
        return reports
      }
    })
  }
}
