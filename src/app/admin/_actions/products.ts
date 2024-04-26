"use server"

import db from "@/db/db";
import { z } from "zod";
import fs from 'fs/promises';
import { notFound, redirect } from "next/navigation";

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// File instance only available on v20.0.0 or upper
const fileSchema = z.instanceof(File, { message: "Required" })

// TODO: Fix file size validation
const imageSchema = fileSchema
  .refine((file) => file.size === 0 || file.type.startsWith('image/'))
  // .refine(
  //   (file) => file.size >= MAX_FILE_SIZE,
  //   `Max file size is ${MAX_FILE_SIZE / 100000}MB.`
  // ) // this should be greater than or equals (>=) not less that or equals (<=)
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    '.jpg, .jpeg, .png and .webp files are accepted.'
  );

const addSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().int().min(1),
  file: z.any().refine(file => file.size > 0, "Required"),
  image: imageSchema.refine(file => file.size > 0, "Required")
});

export const addProduct = async (prevState: unknown, formData: FormData) => {
  console.log(formData);
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