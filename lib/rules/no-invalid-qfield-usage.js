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
      description: 'QField should not be used to wrap QInput, QSelect or QFile',
      category: 'current',
      url: '', // url to docs
      recommended: true
    },
    fixable: 'code',  // or "code" or "whitespace"
    schema: [
      // fill in your schema
    ],
    messages: {
      error: `'q-field' should not be used to wrap '{{ a }}'`
    }
  },

  create: function (context) {
    const sourceCode = context.getSourceCode()
    // variables should be defined here

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------

    // any helper functions should go here or else delete this section
    const qField = 'q-field'
    const components = ['q-input', 'q-select', 'q-file', 'q-datetime'] // no wrap components

    function iterateChildren (element) {
      if (element.children) {
        for (let index = 0; index < element.children.length; ++index) {
          let elm = element.children[index]
          if (elm.type === 'VElement') {
            if (components.includes(elm.rawName)) {
              return {
                name: elm.rawName,
                element: elm
              }
            }
          }
        }
      }
      return false
    }

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return context.parserServices.defineTemplateBodyVisitor({
      VElement (node) {
        const tokens = context.parserServices.getTemplateBodyTokenStore()
        if (qField === node.rawName) {

          let parentNodeStartTag = tokens.getFirstToken(node.startTag)
          let parentNodeStartTagLast = tokens.getLastToken(node.startTag)
          let parentNodeEndTag = tokens.getFirstToken(node.endTag)
          let parentNodeEndTagLast = tokens.getLastToken(node.endTag)

          let getQfieldAttributes = node.startTag.attributes || []
          let formatedProps = []
          getQfieldAttributes.forEach((att) => {
            if (att.key && att.key.argument && att.key.argument.rawName === 'error-label') {
              att.key.argument.rawName = 'error-message'
            }
            if (att.key && att.key.argument) {
              formatedProps.push(` ${att.key.name.rawName}${att.key.argument.rawName}=${sourceCode.getText(att.value)}`)
            } else if(att.key) {
              if (att.directive || (att.value && att.value.type === 'VLiteral')) {
                formatedProps.push(` ${att.key.type === 'VDirectiveKey' ? 'v-' + att.key.name.name : att.key.name }=${sourceCode.getText(att.value)}`)
              } else {
                formatedProps.push(` ${att.key.name}`)
              }
            }
          })
          let val = iterateChildren(node)
          if (val) {
            return context.report({
              messageId: 'error',
              data: {
                a: val.name
              },
              node: node,
              fix (fixer) {
                let problems = []
                const childOpenTag = tokens.getFirstToken(val.element.startTag)
                const childAttr = val.element.startTag.attributes || []
                let mergeClasses = ''
                let index = -1
                const filterAttClass = childAttr.find((x) => {
                  mergeClasses = x.value ? x.value.value : false
                  index = formatedProps.findIndex((x) => x.includes('class='))
                  return x.key.name === 'class' && index !== -1
                })
                if(filterAttClass) {
                  let split = formatedProps[index].split('"')
                  let merge = [...split[1].split(' '), ...mergeClasses.split(' ')]
                  formatedProps.splice(index, 1)
                  merge = [...new Set(merge)];
                  let join = split[0] + '"' + merge.join(' ') + '"' + split[2]
                  formatedProps.push(join)
                  problems.push(fixer.removeRange(filterAttClass.range))
                }
                formatedProps = formatedProps.join('')
                let parentNodeStartRange = [parentNodeStartTag.range[0], parentNodeStartTagLast.range[1]]
                let parentNodeEndRange = [parentNodeEndTag.range[0], parentNodeEndTagLast.range[1]]

                problems.push(fixer.removeRange(parentNodeStartRange))
                problems.push(fixer.removeRange(parentNodeEndRange))
                problems.push(fixer.insertTextAfterRange(childOpenTag.range, formatedProps))
                return problems
              }
            })
          }
        }
      }
    })
  }
}
