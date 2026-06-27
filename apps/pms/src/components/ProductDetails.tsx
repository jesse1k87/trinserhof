import * as React from 'react';
import { canPerform, ProductVariant, User } from '@trinserhof/types';
import { ProductContext } from 'src/context/ProductContext';
import { productsAreDifferent } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import useProducts from 'src/hooks/useProducts';
import useAccountingCategories from 'src/hooks/useAccountingCategories';
import { Input } from '@trinserhof/ui/src/components/input';
import { logAuditEvent, saveProduct } from '@trinserhof/database';
import { toast } from 'sonner';
import { XIcon as Cross2Icon, PlusIcon } from '@trinserhof/ui';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid product data:')) {
    return `This product could not be saved: ${error.message.replace('Invalid product data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This product is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the product.';
};

export const ProductDetails = ({ user }: { user: User }) => {
  const [product, setProduct] = React.useContext(ProductContext);

  const products = useProducts();
  const categories = useAccountingCategories();

  const originalProduct = products?.find((p) => p.id === product?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalProduct);

  React.useEffect(() => {
    if (!product) return;
    setHasChanges(Boolean(!originalProduct || productsAreDifferent(originalProduct, product)));
  }, [product, products]);

  if (!product) return null;

  if (!user) return null;

  const enabled = canPerform(user.role, 'PRODUCT', 'UPDATE');

  const variants = product.variants ?? [];

  const sortedVariantIndices = variants
    .map((_, index) => index)
    .sort((a, b) => variants[a].price - variants[b].price);

  const updateVariants = (newVariants: ProductVariant[]) =>
    setProduct({ ...product, variants: newVariants });

  return (
    <Sheet open onOpenChange={(open) => !open && setProduct(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Product details</SheetTitle>

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
                      variants.map((v, i) =>
                        i === index ? { ...v, name: event.target.value } : v,
                      ),
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
                    <Cross2Icon />
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
              <PlusIcon />
              Add variant
            </Button>
          )}
        </div>

        {canPerform(user.role, 'PRODUCT', 'DELETE') && (
          <div className="flex flex-row justify-between w-full">
            {hasChanges && (
              <div className="flex flex-row justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setProduct(originalProduct ?? null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setProduct(await saveProduct(product));
                      logAuditEvent(
                        originalProduct ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED',
                        user.email,
                      );
                    } catch (error) {
                      toast.error(getSaveErrorMessage(error));
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
