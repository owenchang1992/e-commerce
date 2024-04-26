"use server"

import db from "@/db/db";
import { z } from "zod";
import fs from 'fs/promises';
import { notFound, redirect } from "next/navigation";

const MAX_FILE_SIZE = 500000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// File instance only available on v20.0.0 or upper
const fileSchema = z.instanceof(File, { message: "Required" })

// TODO: Fix file size validation
// TODO: Check checking file size function only if file not null 
const imageSchema = fileSchema
  .refine((file) => file.size === 0 || file.type.startsWith('image/'))
  .refine(
    (file) => file.size <= MAX_FILE_SIZE,
    `Max file size is ${MAX_FILE_SIZE / 100000}MB.`
  )

const addSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().int().min(1),
  file: z.any().refine((file) => file.size > 0, 'Required'),
  image: imageSchema
    .refine((file) => file.size > 0, 'Required')
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
});

export const addProduct = async (prevState: unknown, formData: FormData) => {
  const result = addSchema.safeParse(Object.fromEntries(formData.entries()))
  if (result.success === false) {
    return result.error.formErrors.fieldErrors
  }

  const data = result.data;

  // TODO: update file to AWS S3
  await fs.mkdir("products", { recursive: true })
  const filePath = `products/${crypto.randomUUID()}-${data.file.name}`
  await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()))

  // TODO: update image to AWS S3
  await fs.mkdir("public/products", { recursive: true })
  const imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`
  await fs.writeFile(`public${imagePath}`, Buffer.from(await data.image.arrayBuffer()))

  await db.product.create({
    data: {
      isAvailableForPurchase: false,
      name: data.name,
      description: data.description,
      price: data.price,
      filePath,
      imagePath,
    }
  })

  redirect('/admin/products')
}

const editSchema = addSchema.extend({
  file: fileSchema.optional(),
  image: imageSchema.optional(),
})

export const updateProduct = async (id: string, prevState: unknown, formData: FormData) => {
  const result = editSchema.safeParse(Object.fromEntries(formData.entries()));
  if (result.success === false) {
    return result.error.formErrors.fieldErrors;
  }

  const data = result.data;
  const product = await db.product.findUnique({ where: { id }})

  if (product == null) return notFound()

  let filePath = product.filePath
  if (data.file != null && data.file.size > 0) {
    // TODO: update file to AWS S3
    await fs.unlink(product.filePath)
    filePath = `products/${crypto.randomUUID()}-${data.file.name}`
    await fs.writeFile(filePath, Buffer.from(await data.file.arrayBuffer()))
  }

  let imagePath = product.imagePath
  if (data.image != null && data.image.size > 0) {
    // TODO: update image to AWS S3
    await fs.unlink(product.imagePath)
    imagePath = `/products/${crypto.randomUUID()}-${data.image.name}`
    await fs.writeFile(
      `public${imagePath}`,
      Buffer.from(await data.image.arrayBuffer())
    );
  }

  await db.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      filePath,
      imagePath,
    },
  });

  redirect('/admin/products');
};

export const updateProductAvailability = async (id: string, isAvailableForPurchase: boolean) => {
  await db.product.update({
    where: { id },
    data: {
      isAvailableForPurchase
    },
  });
}

// TODO: Shouldn't remove directly and need some restore mechanisms
export const deleteProduct = async (
  id: string,
) => {
  const product = await db.product.delete({
    where: { id },
  });
  if (product === null) return notFound()

  await fs.unlink(product.filePath)
  await fs.unlink(`public${product.imagePath}`);
};