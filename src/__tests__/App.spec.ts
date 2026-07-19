import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('renders the current route', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: { template: '<main data-testid="route-view" />' },
        },
      },
    })

    expect(wrapper.find('[data-testid="route-view"]').exists()).toBe(true)
  })
})
