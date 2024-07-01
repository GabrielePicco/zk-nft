/* eslint-disable @next/next/no-img-element */

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shadcn/components/ui/card";
import { useAsset } from "../hooks/useAsset";
import { useBlobTxSigContents } from "../hooks/useBlobTxSigContents";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shadcn/components/ui/accordion";
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import { TransferButton } from "./TransferButton";

export const ZkNft = ({ assetId }: { assetId: string }) => {
  const { data: asset } = useAsset(assetId);

  const { data: blob } = useBlobTxSigContents(asset?.blob?.txSig);

  return (
    <div className="w-full sm:w-1/2 lg:w-1/3 p-2">
      {!blob ? (
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-[256px] rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{blob.name}</CardTitle>
            <CardDescription className="break-all text-xs">
              {asset?.assetId}
            </CardDescription>
            <CardDescription>{blob.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <img
              className="max-w-full"
              width={512}
              height={512}
              src={blob.image}
              alt={blob.name}
            />
            <TransferButton assetId={assetId} />
          </CardContent>
          <CardFooter>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="attributes">
                <AccordionTrigger>Attributes</AccordionTrigger>
                <AccordionContent>
                  <pre className="text-sm">
                    {JSON.stringify(blob.attributes, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
