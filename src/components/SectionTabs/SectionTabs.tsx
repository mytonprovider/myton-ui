import { SegmentedControl } from "../SegmentedControl/SegmentedControl"
import { TabDock, type TabDockItem } from "../TabDock/TabDock"
import styles from "./SectionTabs.module.css"

interface SectionTabsProps<T extends string> {
  // The id prefix the tab panels are named by.
  tabs: string
  items: readonly TabDockItem<T>[]
  value: T
  onChange: (value: T) => void
}

// A site's sections: the segmented tabs under the title on a wide screen, the bottom tab bar on a phone.
export const SectionTabs = <T extends string>({ tabs, items, value, onChange }: SectionTabsProps<T>) => (
  <>
    <nav className={styles.row}>
      <SegmentedControl
        tabs={tabs}
        size="lg"
        value={value}
        onChange={onChange}
        options={items.map((item) => ({ value: item.key, label: item.label, badge: item.badge }))}
        className={styles.control}
      />
    </nav>
    <div className={styles.phone}>
      <TabDock tabs={tabs} items={items} value={value} onChange={onChange} />
    </div>
  </>
)

// The row's room while the sections are not known yet, so the content below does not jump when they come.
export const SectionTabsRoom = () => <div aria-hidden="true" className={styles.row} />
