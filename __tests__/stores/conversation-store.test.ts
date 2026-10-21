import { beforeEach, describe, expect, it, vi } from "vitest";

let useConversationStore: (typeof import("#/stores/conversation-store"))["useConversationStore"];
let getComposerBucket: (typeof import("#/stores/conversation-store"))["getComposerBucket"];

const defaultConversationState: {
  selectedTab: "files";
  unpinnedTabs: string[];
  conversationMode: "code" | "plan";
} = {
  selectedTab: "files" as const,
  unpinnedTabs: [] as string[],
  conversationMode: "code" as const,
};

const mockGetConversationState = vi.fn(
  (_id: string) => defaultConversationState,
);
const mockSetConversationState = vi.fn();

vi.mock("#/utils/conversation-local-storage", () => ({
  getConversationState: (id: string) => mockGetConversationState(id),
  setConversationState: (id: string, updates: object) =>
    mockSetConversationState(id, updates),
}));

const CONV_ID = "conv-test-1";

describe("conversation store", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetConversationState.mockReturnValue(defaultConversationState);
    Object.defineProperty(window, "location", {
      value: { pathname: `/conversations/${CONV_ID}` },
      writable: true,
    });
    vi.resetModules();
    ({ useConversationStore, getComposerBucket } =
      await import("#/stores/conversation-store"));
  });

  const composer = (conversationId: string = CONV_ID) =>
    getComposerBucket(useConversationStore.getState(), conversationId);

  it("starts with the complete transient state reset", () => {
    expect(useConversationStore.getState()).toMatchObject({
      isRightPanelShown: false,
      selectedTab: "files",
      byConversation: {},
      shouldShownAgentLoading: false,
      shouldHideSuggestions: false,
      hasRightPanelToggled: false,
      planContent: null,
      conversationMode: "code",
      subConversationTaskId: null,
    });
  });

  describe("setConversationMode", () => {
    it("updates store state and persists via setConversationState when conversation ID is in location", () => {
      useConversationStore.getState().setConversationMode("plan");

      expect(useConversationStore.getState().conversationMode).toBe("plan");
      expect(mockSetConversationState).toHaveBeenCalledWith(CONV_ID, {
        conversationMode: "plan",
      });
    });
  });

  describe("imagesMarkedUploadAsFile", () => {
    it("toggles per-image upload-as-file marks by file name", () => {
      expect(composer().imagesMarkedUploadAsFile).toEqual([]);

      useConversationStore
        .getState()
        .toggleImageUploadAsFile(CONV_ID, "paste.png");
      expect(composer().imagesMarkedUploadAsFile).toEqual(["paste.png"]);

      useConversationStore
        .getState()
        .toggleImageUploadAsFile(CONV_ID, "paste.png");
      expect(composer().imagesMarkedUploadAsFile).toEqual([]);
    });

    it("clears marks when an image is removed", () => {
      const image = new File(["x"], "paste.png", { type: "image/png" });
      useConversationStore.getState().addImages(CONV_ID, [image]);
      useConversationStore
        .getState()
        .toggleImageUploadAsFile(CONV_ID, "paste.png");
      useConversationStore.getState().removeImage(CONV_ID, 0);

      expect(composer().imagesMarkedUploadAsFile).toEqual([]);
    });

    it("is reset by clearAllFiles", () => {
      useConversationStore
        .getState()
        .toggleImageUploadAsFile(CONV_ID, "paste.png");
      useConversationStore.getState().clearAllFiles(CONV_ID);
      expect(composer().imagesMarkedUploadAsFile).toEqual([]);
    });
  });

  describe("pastedImageNames", () => {
    it("tracks attached image names for the upload-as-file control", () => {
      useConversationStore.getState().markImagesAsPasted(CONV_ID, ["shot.png"]);
      expect(composer().pastedImageNames).toEqual(["shot.png"]);
    });

    it("clears pasted names when the image is removed", () => {
      const image = new File(["x"], "shot.png", { type: "image/png" });
      useConversationStore.getState().addImages(CONV_ID, [image]);
      useConversationStore.getState().markImagesAsPasted(CONV_ID, ["shot.png"]);
      useConversationStore.getState().removeImage(CONV_ID, 0);
      expect(composer().pastedImageNames).toEqual([]);
    });
  });

  describe("composer isolation", () => {
    it("keeps attachments, drafts and queued messages per conversation", () => {
      const image = new File(["x"], "a.png", { type: "image/png" });
      const store = useConversationStore.getState();

      store.addImages("conv-a", [image]);
      store.setMessageToSend("conv-a", "for a");
      store.setSubmittedMessage("conv-a", "sent from a");

      expect(composer("conv-b")).toMatchObject({
        images: [],
        messageToSend: null,
        submittedMessage: null,
      });
      expect(composer("conv-a").images).toEqual([image]);
    });

    it("clearComposer drops only the targeted conversation", () => {
      const store = useConversationStore.getState();
      store.setMessageToSend("conv-a", "a");
      store.setMessageToSend("conv-b", "b");

      store.clearComposer("conv-a");

      expect(composer("conv-a").messageToSend).toBeNull();
      expect(composer("conv-b").messageToSend?.text).toBe("b");
    });
  });

  describe("resetConversationState", () => {
    it("sets conversationMode from getConversationState", () => {
      useConversationStore.setState({ conversationMode: "plan" });
      mockGetConversationState.mockReturnValue({
        selectedTab: "files",
        unpinnedTabs: [],
        conversationMode: "code",
      });

      useConversationStore.getState().resetConversationState();

      expect(useConversationStore.getState().conversationMode).toBe("code");
      expect(mockGetConversationState).toHaveBeenCalledWith(CONV_ID);
    });
  });

  it("updates the panel, tab, loading, and suggestion flags", () => {
    const store = useConversationStore.getState();
    store.setIsRightPanelShown(true);
    store.setSelectedTab("terminal");
    store.setShouldShownAgentLoading(true);
    store.setShouldHideSuggestions(true);
    store.setHasRightPanelToggled(true);

    expect(useConversationStore.getState()).toMatchObject({
      isRightPanelShown: true,
      selectedTab: "terminal",
      shouldShownAgentLoading: true,
      shouldHideSuggestions: true,
      hasRightPanelToggled: true,
    });
  });

  it("appends and removes files and images while preserving unrelated entries", () => {
    const firstImage = new File(["a"], "first.png", { type: "image/png" });
    const secondImage = new File(["b"], "second.png", { type: "image/png" });
    const firstFile = new File(["a"], "first.txt");
    const secondFile = new File(["b"], "second.txt");
    const store = useConversationStore.getState();

    store.addImages(CONV_ID, [firstImage]);
    store.addImages(CONV_ID, [secondImage]);
    store.addFiles(CONV_ID, [firstFile]);
    store.addFiles(CONV_ID, [secondFile]);
    store.markImagesAsPasted(CONV_ID, ["first.png", "first.png", "second.png"]);
    store.toggleImageUploadAsFile(CONV_ID, "first.png");
    store.toggleImageUploadAsFile(CONV_ID, "second.png");
    store.removeImage(CONV_ID, 99);
    expect(composer()).toMatchObject({
      images: [firstImage, secondImage],
      imagesMarkedUploadAsFile: ["first.png", "second.png"],
      pastedImageNames: ["first.png", "second.png"],
    });

    store.removeImage(CONV_ID, 0);
    store.removeFile(CONV_ID, 0);
    expect(composer()).toMatchObject({
      images: [secondImage],
      files: [secondFile],
      imagesMarkedUploadAsFile: ["second.png"],
      pastedImageNames: ["second.png"],
    });

    store.removeFile(CONV_ID, 99);
    expect(composer().files).toEqual([secondFile]);
    store.clearImages(CONV_ID);
    store.clearFiles(CONV_ID);
    expect(composer()).toMatchObject({
      images: [],
      files: [],
    });
  });

  it("deduplicates and removes file and image loading indicators", () => {
    const store = useConversationStore.getState();
    store.addFileLoading(CONV_ID, "one.txt");
    store.addFileLoading(CONV_ID, "one.txt");
    store.addFileLoading(CONV_ID, "two.txt");
    store.addImageLoading(CONV_ID, "one.png");
    store.addImageLoading(CONV_ID, "one.png");
    store.addImageLoading(CONV_ID, "two.png");

    expect(composer()).toMatchObject({
      loadingFiles: ["one.txt", "two.txt"],
      loadingImages: ["one.png", "two.png"],
    });

    store.removeFileLoading(CONV_ID, "one.txt");
    store.removeImageLoading(CONV_ID, "one.png");
    expect(composer()).toMatchObject({
      loadingFiles: ["two.txt"],
      loadingImages: ["two.png"],
    });

    store.clearAllLoading(CONV_ID);
    expect(composer()).toMatchObject({
      loadingFiles: [],
      loadingImages: [],
    });
  });

  it("clears every attachment and loading collection together", () => {
    const image = new File(["a"], "one.png", { type: "image/png" });
    const file = new File(["a"], "one.txt");
    const store = useConversationStore.getState();
    store.addImages(CONV_ID, [image]);
    store.addFiles(CONV_ID, [file]);
    store.toggleImageUploadAsFile(CONV_ID, "one.png");
    store.markImagesAsPasted(CONV_ID, ["one.png"]);
    store.addFileLoading(CONV_ID, "one.txt");
    store.addImageLoading(CONV_ID, "one.png");

    store.clearAllFiles(CONV_ID);

    expect(composer()).toMatchObject({
      images: [],
      files: [],
      imagesMarkedUploadAsFile: [],
      pastedImageNames: [],
      loadingFiles: [],
      loadingImages: [],
    });
  });

  it("creates and consumes timestamped send and restore requests", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(100).mockReturnValueOnce(200);
    const store = useConversationStore.getState();
    store.setMessageToSend(CONV_ID, "send me");
    store.restoreMessageToInputIfEmpty(CONV_ID, "restore me");
    expect(composer()).toMatchObject({
      messageToSend: {
        text: "send me",
        timestamp: 100,
      },
      messageRestoreIfEmpty: { text: "restore me", timestamp: 200 },
    });

    store.clearMessageToSend(CONV_ID);
    store.clearMessageRestoreIfEmpty(CONV_ID);
    expect(composer()).toMatchObject({
      messageToSend: null,
      messageRestoreIfEmpty: null,
    });
  });

  it("updates submitted, task, plan, and conversation-mode state without a route id", () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/" },
      writable: true,
    });
    const store = useConversationStore.getState();
    store.setSubmittedMessage(CONV_ID, "submitted");
    store.setSubConversationTaskId("task-1");
    store.setPlanContent("# Plan");
    store.setConversationMode("plan");

    expect(composer().submittedMessage).toBe("submitted");
    expect(useConversationStore.getState()).toMatchObject({
      subConversationTaskId: "task-1",
      planContent: "# Plan",
      conversationMode: "plan",
    });
    expect(mockSetConversationState).not.toHaveBeenCalled();

    store.setSubmittedMessage(CONV_ID, null);
    store.setSubConversationTaskId(null);
    store.setPlanContent(null);
    expect(composer().submittedMessage).toBeNull();
    expect(useConversationStore.getState()).toMatchObject({
      subConversationTaskId: null,
      planContent: null,
    });
  });

  it("resets transient conversation planning state from persisted mode", () => {
    mockGetConversationState.mockReturnValue({
      selectedTab: "files",
      unpinnedTabs: [],
      conversationMode: "plan",
    });
    useConversationStore.setState({
      shouldHideSuggestions: true,
      subConversationTaskId: "task",
      planContent: "plan",
    });

    useConversationStore.getState().resetConversationState();

    expect(useConversationStore.getState()).toMatchObject({
      shouldHideSuggestions: false,
      conversationMode: "plan",
      subConversationTaskId: null,
      planContent: null,
    });
  });

  it.each([
    [
      "setIsRightPanelShown",
      () => useConversationStore.getState().setIsRightPanelShown(true),
    ],
    ["clearImages", () => useConversationStore.getState().clearImages(CONV_ID)],
    [
      "clearAllFiles",
      () => useConversationStore.getState().clearAllFiles(CONV_ID),
    ],
    [
      "clearAllLoading",
      () => useConversationStore.getState().clearAllLoading(CONV_ID),
    ],
    [
      "setMessageToSend",
      () =>
        useConversationStore.getState().setMessageToSend(CONV_ID, "message"),
    ],
    [
      "clearMessageToSend",
      () => useConversationStore.getState().clearMessageToSend(CONV_ID),
    ],
    [
      "setSubmittedMessage",
      () =>
        useConversationStore.getState().setSubmittedMessage(CONV_ID, "message"),
    ],
    [
      "resetConversationState",
      () => useConversationStore.getState().resetConversationState(),
    ],
  ])("%s preserves unrelated store state and actions", (_name, update) => {
    useConversationStore.setState({ selectedTab: "planner" });

    update();

    expect(useConversationStore.getState().selectedTab).toBe("planner");
    expect(useConversationStore.getState().setSelectedTab).toEqual(
      expect.any(Function),
    );
  });

  it("initializes safely without window and keeps mode changes in memory", async () => {
    vi.resetModules();
    vi.stubGlobal("window", undefined);

    const serverModule = await import("#/stores/conversation-store");
    expect(serverModule.useConversationStore.getState().conversationMode).toBe(
      "code",
    );
    serverModule.useConversationStore.getState().setConversationMode("plan");
    expect(serverModule.useConversationStore.getState().conversationMode).toBe(
      "plan",
    );
    expect(mockSetConversationState).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("initializes code mode without reading persistence when the route has no id", async () => {
    Object.defineProperty(window, "location", {
      value: { pathname: "/" },
      writable: true,
    });
    mockGetConversationState.mockClear();
    vi.resetModules();

    const freshModule = await import("#/stores/conversation-store");

    expect(freshModule.useConversationStore.getState().conversationMode).toBe(
      "code",
    );
    expect(mockGetConversationState).not.toHaveBeenCalled();
  });

  it("initializes a fresh module from persisted conversation mode", async () => {
    mockGetConversationState.mockReturnValue({
      selectedTab: "files",
      unpinnedTabs: [],
      conversationMode: "plan",
    });
    Object.defineProperty(window, "location", {
      value: { pathname: "/conversations/loaded-id/details" },
      writable: true,
    });
    vi.resetModules();

    const loadedModule = await import("#/stores/conversation-store");

    expect(loadedModule.useConversationStore.getState().conversationMode).toBe(
      "plan",
    );
    expect(mockGetConversationState).toHaveBeenCalledWith("loaded-id");
    vi.resetModules();
  });
});
