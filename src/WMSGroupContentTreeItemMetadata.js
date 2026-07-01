import {
  WMSGroupContentTreeItem,
  createToggleAction,
  WindowSlot,
  defaultContentTreeComponentId,
} from '@vcmap/ui';
import MetadataViewer from './MetadataViewer.vue';

class WMSGroupContentTreeItemMetadata extends WMSGroupContentTreeItem {
  /**
   * @type {string}
   */
  static get className() {
    return 'WMSGroupContentTreeItemMetadata';
  }

  constructor(options, app) {
    super(options, app);

    /**
     * @type {string|null}
     * @private
     */
    this._infoUrl = null;
    this.allowedWMSLayers = options.allowedWMSLayers;
    this.infoUrl = options.infoUrl;
    this._destroyAction = null;
    this._app = app;
  }

  //ogcapi:https://geo.sv.rostock.de/metadata/collections/service/items/d0a4e64c-3743-48d6-a717-4b05473d9d39

  /**
   * @type {string|null}
   */
  get infoUrl() {
    return this._infoUrl;
  }

  /**
   * @param {string} url
   */
  set infoUrl(url) {
    // check(url, maybe(String)); // @todo import from @vcsuite/check

    if (this._infoUrl !== url) {
      this._infoUrl = url;
      const name = 'infoUrl';

      if (this._infoUrl) {
        this._destroyAction?.();
        const iconId = this.name.replace(" ","");
        const { action, destroy } = createToggleAction(
          {
            name,
            title: 'content.infoAction.title',
            icon: '$vcsInfo',
          },
          {
            id: iconId,
            parentId: defaultContentTreeComponentId,
            component: MetadataViewer,
            props: {
              infoUrl: this._infoUrl,
              allowedWMSLayers: this.allowedWMSLayers,
            },
            state: {
              headerTitle: 'Metadaten',
              headerIcon: '$vcsInfo'
            },            
            slot: WindowSlot.DYNAMIC_LEFT,
            position:{
              width: '500px',
            }
          },
          
          this._app.windowManager,
          'metadataviewer',
        );
        this._destroyAction = destroy;

        // remove default info action from ContentTreeItem
        this.removeAction(name);
        this.addAction(action, 6);
      } else {
        this.removeAction(name);
      }
    }
  }
  destroy() {
    //this._destroyAction();
    super.destroy();
  }
}

export default WMSGroupContentTreeItemMetadata;
