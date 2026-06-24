import * as React from 'react';
import { canUpdateReservations, TAX_RATES, type TaxRate, User } from '@trinserhof/types';
import { ProductCategoryContext } from 'src/context/ProductCategoryContext';
import { productCategoriesAreDifferent } from '@trinserhof/helpers';
import { Button } from '@trinserhof/ui/src/components/button';
import { Sheet, SheetContent, SheetTitle } from '@trinserhof/ui/src/components/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@trinserhof/ui/src/components/select';
import useProductCategories from 'src/hooks/useProductCategories';
import { Input } from '@trinserhof/ui/src/components/input';
import { logAuditEvent, saveProductCategory } from '@trinserhof/database';
import { NoEditingAllowed } from '@trinserhof/ui';
import { toast } from 'sonner';
import { canDelete } from '@trinserhof/types/src/role';

const getSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid product category data:')) {
    return `This product category could not be saved: ${error.message.replace('Invalid product category data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This product category is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the product category.';
};

export const ProductCategoryDetails = ({ user }: { user: User }) => {
  const [category, setCategory] = React.useContext(ProductCategoryContext);

  const categories = useProductCategories();

  const originalCategory = categories?.find((c) => c.id === category?.id);

  const [hasChanges, setHasChanges] = React.useState<boolean>(!originalCategory);

  React.useEffect(() => {
    if (!category) return;
    setHasChanges(
      Boolean(!originalCategory || productCategoriesAreDifferent(originalCategory, category)),
    );
  }, [category, categories]);

  if (!category) return null;

  if (!user) return null;

  const enabled = canUpdateReservations(user.role);

  return (
    <Sheet open onOpenChange={(open) => !open && setCategory(null)}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="flex flex-col grid gap-4 grid-cols-1 content-start overflow-y-auto p-6 pb-12"
      >
        <SheetTitle className="sr-only">Product category details</SheetTitle>
        {!enabled && <NoEditingAllowed />}

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Name</div>
          <Input
            placeholder="Enter a name"
            value={category.name}
            disabled={!enabled}
            onChange={(event) => setCategory({ ...category, name: event.target.value })}
          />
        </div>

        <div className="flex flex-col w-full grid gap-1">
          <div className="pt-1 text-xs text-muted-foreground">Tax rate</div>
          <Select
            value={String(category.taxRate)}
            disabled={!enabled}
            onValueChange={(value) =>
              setCategory({ ...category, taxRate: Number(value) as TaxRate })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_RATES.map((taxRate) => (
                <SelectItem key={taxRate} value={String(taxRate)}>
                  {taxRate}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canDelete(user.role) && (
          <div className="flex flex-row justify-between w-full">
            <div>
              {category.deleted ? (
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={async () => {
                    try {
                      setCategory(await saveProductCategory({ ...category, deleted: false }));
                      logAuditEvent('PRODUCT_CATEGORY_RESTORED', user.email);
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
                      setCategory(await saveProductCategory({ ...category, deleted: true }));
                      logAuditEvent('PRODUCT_CATEGORY_DELETED', user.email);
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
                  onClick={() => setCategory(originalCategory ?? null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      setCategory(await saveProductCategory(category));
                      logAuditEvent(
                        originalCategory ? 'PRODUCT_CATEGORY_UPDATED' : 'PRODUCT_CATEGORY_CREATED',
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

        {category.id && (
          <div className="flex flex-row justify-center items-center content-center text-xs text-muted-foreground mt-4 grid gap-2">
            <div className="text-center">{category.id}</div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
