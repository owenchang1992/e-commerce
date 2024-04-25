import React from 'react'
import PageHeader from '../_components/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ClientProductsTable from './_components/ClientProductsTable'
import { Plus } from "lucide-react"
import db from '@/db/db'

const ProductsTable = async () => {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      isAvailableForPurchase: true,
      _count: { select: { orders: true }}
    },
    orderBy: { name: "asc" }
  })

  if (products.length === 0) return <p>No Products Found</p>

  return (
    <ClientProductsTable data={products}/>
  )
}

const AdminProductsPage = () => {
  return (
    <>
      <div className='flex justify-between items-center gap-4'>
        <PageHeader>
          Product
        </PageHeader>
        <Button asChild variant="outline" className='rounded-full md:rounded-4' size="icon">
          <Link href="/admin/products/new">
            <Plus className="md:mr-2" size="20" />
            <p className='hidden md:block'>Add Product</p>
          </Link>
        </Button>
      </div>
      <ProductsTable />
    </>
  )
}

export default AdminProductsPage
