"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import React from 'react' 
import { addProduct, updateProduct } from '../../_actions/products';
import { useFormState, useFormStatus } from 'react-dom';
import { Product } from '@prisma/client';
import Image from 'next/image';

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} >{pending ? "Saving" : "Save"}</Button>
  )
}

const ProductForm = ({ product }: { product?: Product | null }) => {
  // use bind to set first Args
  const [error, action] = useFormState(product == null ? addProduct : updateProduct.bind(null, product.id), {})

  return (
    <form action={action} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input type="text" id="name" name="name" required defaultValue={product?.name}/>
        {error.name && <div className='text-destructive'>{error.name}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Price</Label>
        <Input type="number" id="price" name="price" required defaultValue={product?.price}/>
        {error.price && <div className='text-destructive'>{error.price}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required defaultValue={product?.description}/>
        {error.description && <div className='text-destructive'>{error.description}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">File</Label>
        <Input type="file" id="file" name="file" required={product == null}/>
        {product != null && <div className='text-muted-foreground'>{product.filePath}</div>}
        {error.file && <div className='text-destructive'>{error.file}</div>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="image">Image</Label>
        <Input type="file" id="image" name="image" required={product == null} />
        {product != null && <Image src={product?.imagePath} width={400} height={400} alt="Product Image"/>}
        {error.image && <div className='text-destructive'>{error.image}</div>}
      </div>
      <SubmitButton />
    </form>
  )
}

export default ProductForm
