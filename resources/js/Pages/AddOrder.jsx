import { Layout } from '@/Components/Layout'
import OrderPage from '@/Components/Order'
import React from 'react'

function AddOrder({id}) {
  return (
    <Layout>
      <OrderPage id={id}/>
    </Layout>
  )
}

export default AddOrder
