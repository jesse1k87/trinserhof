import * as React from 'react';
import { canUpdateBookings, ProductVariant, User } from '@trinserhof/types';
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
import useProductCategories from 'src/hooks/useProductCategories';
import { Input } from '@trinserhof/ui/src/components/input';
import { logAuditEvent, saveProduct } from '@trinserhof/database';
import { NoEditingAllowed } from '@trinserhof/ui';
import { toast } from 'sonner';
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons';
import { canDelete } from '@trinserhof/types/src/role';

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
  const categories = useProductCategories();

  const originalProduct = products?.find((p) => p.id === product?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalProduct);

  React.useEffect(() => {
    if (!product) return;
    setHasChanges(Boolean(!originalProduct || productsAreDifferent(originalProduct, product)));
  }, [product, products]);

  if (!product) return null;

  if (!user) return null;

  const enabled = canUpdateBookings(user.role);

  const variants = product.variants ?? [];

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
        {!enabled && <NoEditingAllowed />}

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
          <div className="pt-1 text-xs text-muted-foreground">Description</div>
          <Input
            placeholder="Enter a description"
            value={product.description ?? ''}
            disabled={!enabled}
            onChange={(event) => setProduct({ ...product, description: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Category</div>
          <Select
            value={product.categoryId || 'none'}
            disabled={!enabled}
            onValueChange={(categoryId) =>
              setProduct({ ...product, categoryId: categoryId === 'none' ? undefined : categoryId })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories.map((category) => (
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
          {variants.map((variant, index) => (
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
                  <Cross2Icon />
                </Button>
              )}
            </div>
          ))}
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

        {canDelete(user.role) && (
          <div className="flex flex-row justify-between w-full">
            <div>
              {product.deleted ? (
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={async () => {
                    try {
                      setProduct(await saveProduct({ ...product, deleted: false }));
                      logAuditEvent('PRODUCT_RESTORED', user.email);
                    } catch (error) {
                      toast.error(getSaveErrorMessage(error));
                    }
                  }}
                >
                  Restore
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="mr-2"
                  onClick={async () => {
                    try {
                      setProduct(await saveProduct({ ...product, deleted: true }));
                      logAuditEvent('PRODUCT_DELETED', user.email);
                    } catch (error) {
                      toast.error(getSaveErrorMessage(error));
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
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

        {product.id && (
          <div className="flex flex-row justify-center items-center content-center text-xs text-muted-foreground mt-4 grid gap-2">
            <div className="text-center">{product.id}</div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
