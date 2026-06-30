import * as React from 'react';
import { canPerform, Product, ProductVariant, User } from '@trinserhof/types';
import { getNewProduct, productsAreDifferent } from '@trinserhof/helpers';
import { type Page } from 'src/types/page';
import {
  Button,
  ICONS,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui';
import useProducts from 'src/hooks/useProducts';
import useAccountingCategories from 'src/hooks/useAccountingCategories';
import { logAuditEvent, saveProduct } from '@trinserhof/supabase';
import { toast } from 'sonner';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid product data:')) {
    return `This product could not be saved: ${error.message.replace('Invalid product data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This product is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the product.';
};

export const ProductDetailPage = ({
  id,
  user,
  navigate,
}: {
  id: string;
  user: User;
  navigate: (page: Page, id?: string) => void;
}) => {
  const isNew = id === 'new';

  const products = useProducts();
  const categories = useAccountingCategories();

  const originalProduct = isNew ? undefined : products.find((p) => p.id === id);

  const [product, setProduct] = React.useState<Product | undefined>(() =>
    isNew ? getNewProduct() : undefined,
  );

  React.useEffect(() => {
    if (!isNew) setProduct(originalProduct);
  }, [isNew, originalProduct]);

  React.useEffect(() => {
    if (!isNew && products.length > 0 && !originalProduct) {
      navigate('products-table');
    }
  }, [isNew, products.length, originalProduct, navigate]);

  const canCreate = canPerform(user.role, 'PRODUCT', 'CREATE');
  const canUpdate = canPerform(user.role, 'PRODUCT', 'UPDATE');

  if (isNew && !canCreate) return null;
  if (!product) return null;

  const enabled = isNew ? canCreate : canUpdate;
  const hasChanges = isNew || (!!originalProduct && productsAreDifferent(originalProduct, product));

  const variants = product.variants ?? [];

  const sortedVariantIndices = variants
    .map((_, index) => index)
    .sort((a, b) => variants[a].price - variants[b].price);

  const updateVariants = (newVariants: ProductVariant[]) =>
    setProduct({ ...product, variants: newVariants });

  const handleSave = async () => {
    try {
      const saved = await saveProduct(product);
      logAuditEvent(originalProduct ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED', user.email);
      if (isNew) navigate('products-table');
      else setProduct(saved);
    } catch (error) {
      toast.error(getSaveErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl px-4 py-6">
      <div className="flex flex-row items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to products"
          className="hover:cursor-pointer"
          onClick={() => navigate('products-table')}
        >
          <ICONS.arrowLeft />
        </Button>
        <PageHeader
          icon={<ICONS.product className="size-5" />}
          title={isNew ? 'New product' : 'Product'}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Name</div>
        <Input
          placeholder="Enter a name"
          value={product.name}
          disabled={!enabled}
          onChange={(event) => setProduct({ ...product, name: event.target.value })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Category</div>
        <Select
          value={product.accountingCategoryId || 'none'}
          disabled={!enabled}
          onValueChange={(accountingCategoryId) =>
            setProduct({
              ...product,
              accountingCategoryId,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No category</SelectItem>
            {[...categories]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col w-full grid gap-1">
        <div className="pt-1 text-xs text-muted-foreground">Price</div>
        <Input
          type="number"
          placeholder="Price"
          value={product.price}
          disabled={!enabled}
          onChange={(event) => setProduct({ ...product, price: Number(event.target.value) })}
        />
      </div>

      <div className="flex flex-col w-full grid gap-2">
        <div className="pt-1 text-xs text-muted-foreground">Variants</div>
        {sortedVariantIndices.map((index) => {
          const variant = variants[index];
          return (
            <div key={index} className="flex flex-row gap-2 items-center">
              <Input
                placeholder="Name"
                value={variant.name}
                disabled={!enabled}
                onChange={(event) =>
                  updateVariants(
                    variants.map((v, i) => (i === index ? { ...v, name: event.target.value } : v)),
                  )
                }
              />
              <Input
                type="number"
                placeholder="Price"
                value={variant.price}
                disabled={!enabled}
                className="w-28"
                onChange={(event) =>
                  updateVariants(
                    variants.map((v, i) =>
                      i === index ? { ...v, price: Number(event.target.value) } : v,
                    ),
                  )
                }
              />
              {enabled && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Remove variant"
                  className="shrink-0 hover:cursor-pointer"
                  onClick={() => updateVariants(variants.filter((_, i) => i !== index))}
                >
                  <ICONS.close />
                </Button>
              )}
            </div>
          );
        })}
        {enabled && (
          <Button
            variant="outline"
            size="sm"
            className="self-start hover:cursor-pointer"
            onClick={() => updateVariants([...variants, { name: '', price: 0 }])}
          >
            <ICONS.add />
            Add variant
          </Button>
        )}
      </div>

      {enabled && hasChanges && (
        <div className="flex flex-row justify-end w-full">
          <Button onClick={handleSave}>Save</Button>
        </div>
      )}
    </div>
  );
};
