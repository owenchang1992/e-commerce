import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import db from '@/db/db'
import { formatCurrency, formatNumber } from '@/lib/formatter'

const getSalesData = async () => {
  const data = await db.order.aggregate({
    _sum: { pricePaidInCents: true }, 
    _count: true
  })

  return {
    amount: (data._sum.pricePaidInCents || 0),
    numberOfSales: data._count
  }
}

const getUserData = async () => {
  const [userCount, orderData ] = await Promise.all([
    db.user.count(),
    db.order.aggregate({
      _sum: { pricePaidInCents: true },
    })
  ])

  return {
    userCount,
    averageValuePerUser: userCount === 0 ? 0 : (orderData._sum.pricePaidInCents || 0) / userCount
  }
}

const getProductData = async () => {
  const [ activeCount, inactiveCount ] = await Promise.all([
    db.product.count({ where: { isAvailableForPurchase: true }}),
    db.product.count({ where: { isAvailableForPurchase: false } }),
  ])

  return {
    activeCount,
    inactiveCount
  }
}

const AdminDashboardCard = async () => {
  const [ salesData, userData, productData ] = await Promise.all([
    getSalesData(),
    getUserData(),
    getProductData(),
  ])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <DashboardCard
        title="Sales"
        subtitle={`${formatNumber(salesData.numberOfSales)} Orders`}
        body={formatCurrency(10000.444444)}
      />
      <DashboardCard
        title="Customers"
        subtitle={`${formatCurrency(userData.averageValuePerUser)} Average Value`}
        body={formatNumber(userData.userCount)}
      />
      <DashboardCard
        title="Active Products"
        subtitle={`${formatNumber(salesData.numberOfSales)} Inactive`}
        body={`${formatNumber(salesData.amount)} active`}
      />
    </div>
  )
}

export default AdminDashboardCard

type DashboardCardProps = {
  title: string;
  subtitle: string;
  body: string;
}

const DashboardCard = ({ title, subtitle, body}: DashboardCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          {body}
        </p>
      </CardContent>
    </Card>
  )
}