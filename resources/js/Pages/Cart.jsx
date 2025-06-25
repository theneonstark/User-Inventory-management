import CartPage from '@/Components/Cart'
import { Layout } from '@/Components/Layout'
import React from 'react'

function Cart({cartItems}) {
  
  return (
    <Layout>
      <CartPage cartItems={cartItems}/>
    </Layout>
  )
}

export default Cart
