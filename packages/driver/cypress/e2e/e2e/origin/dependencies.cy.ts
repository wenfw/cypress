describe('cy.origin dependencies', () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
  })

  it('works with an arrow function', () => {
    cy.origin('http://foobar.com:3500', () => {
      const lodash = Cypress.require('lodash')
      const dayjs = Cypress.require('dayjs')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')
      expect(dayjs('2022-07-29 12:00:00').format('MMMM D, YYYY')).to.equal('July 29, 2022')

      cy.log('command log')
    })
  })

  it('works with a function expression', () => {
    cy.origin('http://foobar.com:3500', function () {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')
    })
  })

  it('works with options object + args', () => {
    cy.origin('http://foobar.com:3500', { args: ['arg1'] }, ([arg1]) => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')
      expect(arg1).to.equal('arg1')
    })
  })

  it('works with a yielded value', () => {
    cy.origin('http://foobar.com:3500', () => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')

      cy.wrap('yielded value')
    })
    .should('equal', 'yielded value')
  })

  it('works with a returned value', () => {
    cy.origin('http://foobar.com:3500', () => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')

      return 'returned value'
    })
    .should('equal', 'returned value')
  })

  it('works with multiple cy.origin calls', () => {
    cy.origin('http://foobar.com:3500', () => {
      const lodash = Cypress.require('lodash')

      expect(lodash.get({ foo: 'foo' }, 'foo')).to.equal('foo')

      cy.get('[data-cy="cross-origin-tertiary-link"]').click()
    })

    cy.origin('http://idp.com:3500', () => {
      const dayjs = Cypress.require('dayjs')

      expect(dayjs('2022-07-29 12:00:00').format('MMMM D, YYYY')).to.equal('July 29, 2022')
    })
  })

  it('works with a relative esm dependency', () => {
    cy.origin('http://foobar.com:3500', () => {
      const { add } = Cypress.require('./dependencies.support-esm')

      expect(add(1, 2)).to.equal(3)
    })
  })

  it('works with a relative commonjs dependency', () => {
    cy.origin('http://foobar.com:3500', () => {
      const { add } = Cypress.require('./dependencies.support-commonjs')

      expect(add(1, 2)).to.equal(3)
    })
  })

  it('works with args passed to require result', () => {
    const args = ['some string']

    cy.origin('http://foobar.com:3500', { args }, ([arg1]) => {
      const result = Cypress.require('./dependencies.support-commonjs')(arg1)

      expect(result).to.equal('some_string')
    })
  })

  it('works in support file', () => {
    cy.origin('http://foobar.com:3500', () => {
      expect(cy.getAll).to.be.undefined
    })

    cy.originLoadUtils('http://foobar.com:3500')

    cy.origin('http://foobar.com:3500', () => {
      expect(cy.getAll).to.be.a('function')
    })
  })

  describe('errors', () => {
    it('when dependency does not exist', () => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('Cannot find module')
      })

      cy.origin('http://foobar.com:3500', () => {
        Cypress.require('./does-not-exist')
      })
    })

    it('when Cypress.require() is used outside cy.origin() callback', () => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`Cypress.require()` can only be used inside the `cy.origin()` callback.')
      })

      Cypress.require('./does-not-exist')
    })
  })
})
