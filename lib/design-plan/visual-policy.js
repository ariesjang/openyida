'use strict';

function getVisualDecisionPolicy() {
  return {
    reference: 'yida-skills/skills/yida-design/references/theme-selection.md#设计方向比较',
    preserve: 'explicit_user_direction_brand_and_existing_app_theme',
    nativeFormLayout: {
      model: 'component_based_native_form_layout',
      regions: ['top', 'left', 'main', 'right', 'between_fields'],
      components: ['tabs', 'button_groups', 'images', 'graphics', 'status_blocks', 'dividers', 'columns', 'fields'],
      roles: ['navigation', 'action', 'visual_focus', 'feedback', 'hierarchy', 'rhythm', 'decoration', 'data_capture'],
      rules: ['place_components_by_role', 'preserve_existing_component_tree', 'use_divider_for_business_groups'],
      forbidden: ['generic_filler_copy', 'random_layout_rotation'],
    },
    creativeOption: { alwaysAvailable: true, themeId: 'free-creative', selectionRequired: false,
      source: 'independent_business_reasoning_not_preset_matching',
      authoringReference: 'yida-skills/skills/yida-design/references/application-style-library.md' },
    comparison: { candidateCount: 3, baseline: 'first_instinct', alternatives: 2, distinctDimensions: 2,
      dimensions: ['composition', 'typography', 'surface_hierarchy', 'color_relationships'] },
    selection: 'refine_and_choose_a_supported_alternative_within_business_constraints',
    quality: ['task_efficiency', 'readability_and_contrast', 'consistent_spacing_and_alignment', 'coherent_visual_identity'],
    execution: 'one_shared_three_direction_generation_pass_for_fast_and_plan',
    handoff: ['visualSelection.visualDirection.description', 'visualSelection.colorStrategy.usage'],
    presentation: 'fast_selects_internally; plan_asks_user_when_no_explicit_visual_direction',
  };
}

module.exports = { getVisualDecisionPolicy };
