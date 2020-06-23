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
      description: 'Refactoring css breakpoints',
      category: 'current',
      url: '', // url to docs
      recommended: true
    },
    fixable: 'code',  // or "code" or "whitespace"
    schema: [
      // fill in your schema
    ],
    messages: {
      info: `'{{ a }}' can be removed`
    }
  },
  create: function (context) {
    const sourceCode = context.getSourceCode()
    // variables should be defined here

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------
    // any helper functions should go here or else delete this section
    let replace = {
      'class': {
        'q-gutter-': {
          replaceTo: 'q-col-gutter-',
        },
        'col-lg-': {
          replaceTo: 'col-md-',
          rules: ['col-md-12']
        }
      }
    }

    function getComponet (element) {
      if (element.type === 'VElement') {
        return {
          name: element.rawName,
          element: element
        }
      }
    }

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return context.parserServices.defineTemplateBodyVisitor({
      VElement (node) {
        const tokens = context.parserServices.getTemplateBodyTokenStore()
        let reports = []
        let component = getComponet(node)
        if (component) {
          let problems = []
          let attributes = component.element.startTag.attributes || []
          // Remove
          attributes.forEach((att) => {
              ;['class'].forEach((type) => {
                if (att.key.name === type) {
                  const attValue = att.value.value
                  const attSplit = attValue.split(' ')
                  const replceClasses = replace[type]
                  let rules = []
                  let items = []
                  for (var key in replceClasses) {
                    if (replceClasses.hasOwnProperty(key)) {
                      items = attSplit.filter((x) => {
                        if (replceClasses[key] && replceClasses[key]['rules']) {
                          replceClasses[key]['rules'].forEach((y) => {
                            if (x.includes(y)) {
                              rules.push(y)
                            }
                          })
                        }
                        return x.includes(key)
                      })
                    }
                    if (items.length > 0) {
                      reports.push(context.report({
                        messageId: 'info',
                        data: {
                          a: component.name + ' ' + items
                        },
                        node: node,
                        fix (fixer) {
                          if (difference.length > 0) {
                            return fixer.replaceTextRange(att.range, `${type}="${difference}"`)
                          }
                        }
                      }))
                    }
                  }
                }
              })
            }
          )
        }
        return reports
      }
    })
  }
}

