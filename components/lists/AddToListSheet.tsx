import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { router } from "expo-router";

export function AddToListSheet({
  visible,
  restaurantId,
  restaurantName,
  onClose,
  onAdded,
}: {
  visible: boolean;
  restaurantId: string;
  restaurantName: string;
  onClose: () => void;
  onAdded?: (listName: string) => void;
}) {
  const { getMyLists, listItems, addListItem, canEditList } = useAppStore();
  const lists = getMyLists().filter((l) => canEditList(l.id));
  const inLists = new Set(
    listItems.filter((li) => li.restaurantId === restaurantId).map((li) => li.listId),
  );

  const handleAdd = async (listId: string, listName: string) => {
    const result = await addListItem(listId, restaurantId);
    if (result.ok) {
      onAdded?.(listName);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white dark:bg-savr-900 rounded-t-3xl max-h-[70%]">
          <View className="items-center py-3">
            <View className="w-10 h-1 rounded-full bg-savr-200 dark:bg-savr-700" />
          </View>
          <Text className="text-lg font-semibold text-savr-900 dark:text-savr-100 px-5 mb-1">Add to list</Text>
          <Text className="text-sm text-savr-500 dark:text-savr-400 px-5 mb-4" numberOfLines={1}>{restaurantName}</Text>

          <ScrollView contentContainerClassName="px-5 pb-8 gap-2">
            {lists.length === 0 ? (
              <View className="items-center py-6 gap-3">
                <Text className="text-savr-500 text-center">Create a list first to save this spot.</Text>
                <Button label="Create List" onPress={() => { onClose(); router.push("/create-list"); }} />
              </View>
            ) : (
              lists.map((list) => {
                const added = inLists.has(list.id);
                return (
                  <Pressable
                    key={list.id}
                    disabled={added}
                    onPress={() => handleAdd(list.id, list.name)}
                    className="flex-row items-center justify-between py-3 border-b border-savr-100 dark:border-savr-800"
                  >
                    <View className="flex-1">
                      <Text className="font-medium text-savr-900 dark:text-savr-100">{list.name}</Text>
                      {list.description ? (
                        <Text className="text-xs text-savr-500 dark:text-savr-400">{list.description}</Text>
                      ) : null}
                    </View>
                    {added ? (
                      <Text className="text-xs text-savr-400">Added</Text>
                    ) : (
                      <Ionicons name="add-circle-outline" size={22} color="#FF8559" />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

