import React from 'react'
import PageHeader from '../../_components/PageHeader'
import ProductForm from '../_components/ProductForm'

const NewProductPage = () => {
  return (
    <>
      <PageHeader>
        <h1 className='text-4xl'>Add Product</h1>
      </PageHeader>
      <ProductForm />
    </>
  )
}

export default NewProductPage
