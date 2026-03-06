import {
  LayerContentTreeItem,
  createToggleAction,
  WindowSlot,
  defaultContentTreeComponentId,
} from '@vcmap/ui';
import MetadataViewer from './MetadataViewer.vue';

class ContentTreeItemMetadata extends LayerContentTreeItem {
  /**
   * @type {string}
   */
  static get className() {
    return 'ContentTreeItemMetadata';
  }

  constructor(options, app) {
    super(options, app);

    /**
     * @type {string|null}
     * @private
     */
    this._infoUrl = null;
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
        const { action, destroy } = createToggleAction(
          {
            name,
            title: 'content.infoAction.title',
            icon: '$vcsInfo',
          },
          {
            id: 'metadataWindow',
            parentId: defaultContentTreeComponentId,
            component: MetadataViewer,
            props: {
              infoUrl: this._infoUrl,
            },
            state: {
              headerTitle: 'Metadaten',
              headerIcon: '$vcsInfo'
            },            
            slot: WindowSlot.DYNAMIC_LEFT,
          },
          
          this._app.windowManager,
          'metadataviewer',
        );
        console.log(this._app.windowManager);
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

export default ContentTreeItemMetadata;
