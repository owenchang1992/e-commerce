import React, { ReactNode } from 'react'

const PageHeader = ({ children }: { children: ReactNode }) => {
  return (
    <div className='flex justify-between items-center gap-4 mb-2 lg:mb-4'>
      {children}
    </div>
  )
}

export default PageHeader