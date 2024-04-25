import React from 'react'
import PageHeader from '../_components/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ProductsTable from './_components/ProductsTable'

const AdminProductsPage = () => {
  return (
    <>
      <div className='flex justify-between items-center gap-4'>
        <PageHeader>
          Product
        </PageHeader>
        <Button asChild>
          <Link href="/admin/products/new">Add Product</Link>
        </Button>
      </div>
      <ProductsTable />
    </>
  )
}

export default AdminProductsPage
