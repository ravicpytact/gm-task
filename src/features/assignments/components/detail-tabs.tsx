"use client";

import { useQueryStates } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DETAIL_TABS, detailParsers } from "../constants";
import type { DetailChanges, DetailScope } from "../utils";
import { DetailAssignmentsTab } from "./detail-assignments-tab";
import { DetailHistoryTab } from "./detail-history-tab";

const parseTab = (value: string) => DETAIL_TABS.find((t) => t === value) ?? "assignments";

/** No filters: what a tab shows when it opens. */
const CLEARED: DetailChanges = {
  status: null,
  frequency: null,
  from: null,
  to: null,
  user: null,
  task: null,
  page: null,
};

/**
 * The Assignments and History tabs of User Detail and Task Detail. The open tab and its filters
 * are in the URL (`?tab=assignments|history&…`), so a link opens the same view.
 */
export function DetailTabs({ scope, emptyText }: { scope: DetailScope; emptyText: string }) {
  const [params, setParams] = useQueryStates(detailParsers);
  const update = (changes: DetailChanges) => void setParams(changes);

  return (
    <Tabs
      value={params.tab}
      // Each tab has its own filters: switching starts the other one without them.
      onValueChange={(value) => void setParams({ ...CLEARED, tab: parseTab(value) })}
    >
      <TabsList className="mb-4">
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="assignments">
        <DetailAssignmentsTab
          scope={scope}
          emptyText={emptyText}
          params={params}
          setParams={update}
        />
      </TabsContent>
      <TabsContent value="history">
        <DetailHistoryTab scope={scope} params={params} setParams={update} />
      </TabsContent>
    </Tabs>
  );
}
