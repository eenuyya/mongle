/**
 * 코스 상세 화면 목업 데이터
 * discover_results.json 서촌 실제 좌표 기반
 * 이미지: picsum.photos (실제 서비스에서는 Supabase Storage URL 사용)
 */

export const MOCK_COURSE = {
  id: "preview",
  title: "서촌, 나만 아는 골목",
  description:
    "혼자이기 때문에 더 천천히 볼 수 있는 서촌. 빈티지 옷 한 벌 골라 들고, 카페에서 뜨거운 라테 한 잔. 그냥 걷기만 해도 좋은 오후.",
  theme_tag: "#혼놀코스",
  district: "서촌",
  duration_min: 210,
  place_count: 4,
  cover_image: null,
  is_editor_pick: true,
  has_popup: false,
  expires_at: null,
};

export const MOCK_COURSE_PLACES = [
  {
    order_index: 0,
    visit_duration_min: 60,
    note: "오전 오픈 직후가 한산해요. 1970~90년대 데님과 가죽 재킷이 많아요.",
    places: {
      id: "place-1",
      name: "콜리빌리",
      category: "shop",
      address: "서울특별시 종로구 자하문로7길 54 지하1층",
      district: "서촌",
      lat: 37.579789,
      lng: 126.969473,
      images: [
        "https://picsum.photos/seed/colibilly/400/400",
        "https://picsum.photos/seed/colibilly2/400/400",
      ],
    },
  },
  {
    order_index: 1,
    visit_duration_min: 70,
    note: "통창으로 서촌 골목이 내려다보여요. 에스프레소 베이스 음료가 진하고 좋아요.",
    places: {
      id: "place-2",
      name: "레스피레베이커리카페 서촌",
      category: "cafe",
      address: "서울특별시 종로구 효자로13길 40-7",
      district: "서촌",
      lat: 37.582765,
      lng: 126.972145,
      images: [
        "https://picsum.photos/seed/respire1/400/400",
        "https://picsum.photos/seed/respire2/400/400",
      ],
    },
  },
  {
    order_index: 2,
    visit_duration_min: 50,
    note: "작은 편집샵. 독립 아티스트 엽서와 포스터가 한 쪽 벽을 채우고 있어요.",
    places: {
      id: "place-3",
      name: "메종드소시송",
      category: "shop",
      address: "서울특별시 종로구 자하문로 82 1층",
      district: "서촌",
      lat: 37.583301,
      lng: 126.970624,
      images: [
        "https://picsum.photos/seed/maison1/400/400",
        "https://picsum.photos/seed/maison2/400/400",
      ],
    },
  },
  {
    order_index: 3,
    visit_duration_min: 60,
    note: "오후 빛이 들어오는 창가 자리에 앉으면 한 시간이 금방 가요. 마무리 커피로 딱이에요.",
    places: {
      id: "place-4",
      name: "스태픽스",
      category: "cafe",
      address: "서울특별시 종로구 사직로9길 22 102호",
      district: "서촌",
      lat: 37.57747,
      lng: 126.968031,
      images: [
        "https://picsum.photos/seed/stafixs1/400/400",
        "https://picsum.photos/seed/stafixs2/400/400",
      ],
    },
  },
];
