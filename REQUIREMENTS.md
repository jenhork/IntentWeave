# IntentWeave requirements

This list records the behavior of the current diagram editor and is intended to grow with IntentWeave. All requirements below are **implemented**. IDs should remain stable; when behavior intentionally changes, update the requirement and its related tests together. The tests are browser-based regression tests in [tests/goal-editor.spec.js](tests/goal-editor.spec.js), [tests/intentional-elements.spec.js](tests/intentional-elements.spec.js), [tests/contribution-links.spec.js](tests/contribution-links.spec.js), and [tests/actors.spec.js](tests/actors.spec.js), and [tests/element-resizing.spec.js](tests/element-resizing.spec.js), and [tests/actor-collapse.spec.js](tests/actor-collapse.spec.js), and [tests/straight-links.spec.js](tests/straight-links.spec.js), and [tests/canvas-expansion.spec.js](tests/canvas-expansion.spec.js), and [tests/dependency-links.spec.js](tests/dependency-links.spec.js), and [tests/exports.spec.js](tests/exports.spec.js).

## R-001 — Draw a goal

The user can select **Add goal** and click the diagram canvas to place a new goal. The goal appears on the canvas, is selected, and the displayed goal count increases. The user can also drag the goal tool onto the canvas.

- Related test: T-001 checks click-to-place and the count. Dragging the tool onto the canvas is not yet tested.

### R-001.1 — Name a goal

The user can select a goal and edit its name in the Name field. The goal displays the updated name, and selecting it again shows that name in the field.

- Related test: T-001.

### R-001.2 — Delete a goal

The user can delete a selected goal using **Delete goal**. The goal disappears and the goal count decreases.

- Related tests: T-001 checks the delete button; T-005 checks keyboard deletion.

## R-002 — Save a diagram

The user can save the current goal diagram as a local JSON file. The saved data includes the goals, their names, and their positions.

- Related test: T-003 checks a one-goal save and reopen.

## R-003 — Load a diagram

The user can open a compatible IntentWeave JSON diagram. Its goals, names, and positions are restored on the canvas. If the current diagram has unsaved changes, the user is asked to confirm replacement.

- Related test: T-003 checks reopening a one-goal diagram and accepts the replacement prompt. Cancelling the prompt is not yet tested.

## R-004 — Move a goal

The user can move a goal by dragging it or by using the arrow keys while it has keyboard focus. Goal positions are constrained to keep goals within the canvas.

- Related tests: T-002 checks dragging, an arrow-key move, and the right-hand boundary. Other boundaries are not yet tested. T-005 also checks a keyboard move.

## R-005 — Handle invalid diagram files

When a diagram file is malformed or contains invalid goal data, the editor reports that it could not open the file and preserves the current diagram.

- Related test: T-004 checks malformed JSON and one invalid goal data case.

## R-006 — Operate goals with the keyboard

A goal can receive keyboard focus; focusing it selects it and displays its name. A focused goal can be moved with arrow keys and deleted with the Delete key.

- Related test: T-005. The test focuses the goal directly; navigating to it with Tab is not yet tested. T-002 also checks arrow-key movement.

## R-007 — Draw a softgoal / quality

The user can select or drag the **Add quality** tool to place a cloud-shaped quality (formerly called a softgoal). It is selected after placement and contributes to the displayed count. Related test: T-006 checks click placement, shape, selection, and count; palette dragging is not yet tested. T-024 checks the palette label.

### R-007.1 — Name a softgoal / quality

A new quality is named **Quality** by default. The user can select and rename the element, and see the updated name. Related tests: T-006 and T-032.

### R-007.2 — Delete a softgoal / quality

The user can delete the selected element using the delete button or keyboard. Related tests: T-006 and T-010.

## R-008 — Save softgoals / qualities

The diagram can be saved as local JSON preserving the element type, name, and position. Related tests: T-008 and T-021.

## R-009 — Load softgoals / qualities

The editor can open a compatible saved diagram and restore the element type, name, and position, with confirmation before replacing unsaved work. Related test: T-008 accepts the confirmation; cancelling is not yet tested. T-021 checks a mixed diagram.

## R-010 — Move a softgoal / quality

The user can drag it or use arrow keys while focused, within the canvas boundaries. Related tests: T-007 and T-010. T-007 checks the right boundary; other boundaries are not yet tested.

## R-011 — Handle invalid files with softgoals / qualities

The editor reports malformed or invalid input and preserves the current diagram. Related test: T-009.

## R-012 — Operate softgoals / qualities with the keyboard

Focusing an element selects it and shows its name; arrow keys move it and Delete removes it. Related tests: T-007 and T-010. Tab navigation is not yet tested.

## R-013 — Draw a task

The user can select or drag the task tool to place a wide hexagonal element. It is selected after placement and contributes to the displayed count. Related test: T-011 checks click placement, shape, selection, and count; palette dragging is not yet tested.

### R-013.1 — Name a task

The user can select and rename the task, and see the updated name. Related test: T-011.

### R-013.2 — Delete a task

The user can delete the selected task using the delete button or keyboard. Related tests: T-011 and T-015.

## R-014 — Save tasks

The diagram can be saved as local JSON preserving the task type, name, and position. Related tests: T-013 and T-021.

## R-015 — Load tasks

The editor can open a compatible saved diagram and restore the task type, name, and position, with confirmation before replacing unsaved work. Related test: T-013 accepts the confirmation; cancelling is not yet tested. T-021 checks a mixed diagram.

## R-016 — Move a task

The user can drag it or use arrow keys while focused, within the canvas boundaries. Related tests: T-012 and T-015. T-012 checks the right boundary; other boundaries are not yet tested.

## R-017 — Handle invalid files with tasks

The editor reports malformed or invalid input and preserves the current diagram. Related test: T-014.

## R-018 — Operate tasks with the keyboard

Focusing a task selects it and shows its name; arrow keys move it and Delete removes it. Related tests: T-012 and T-015. Tab navigation is not yet tested.

## R-019 — Draw a resource

The user can select or drag the resource tool to place a rectangular element. It is selected after placement and contributes to the displayed count. Related test: T-016 checks click placement, shape, selection, and count; palette dragging is not yet tested.

### R-019.1 — Name a resource

The user can select and rename the resource, and see the updated name. Related test: T-016.

### R-019.2 — Delete a resource

The user can delete the selected resource using the delete button or keyboard. Related tests: T-016 and T-020.

## R-020 — Save resources

The diagram can be saved as local JSON preserving the resource type, name, and position. Related tests: T-018 and T-021.

## R-021 — Load resources

The editor can open a compatible saved diagram and restore the resource type, name, and position, with confirmation before replacing unsaved work. Related test: T-018 accepts the confirmation; cancelling is not yet tested. T-021 checks a mixed diagram.

## R-022 — Move a resource

The user can drag it or use arrow keys while focused, within the canvas boundaries. Related tests: T-017 and T-020. T-017 checks the right boundary; other boundaries are not yet tested.

## R-023 — Handle invalid files with resources

The editor reports malformed or invalid input and preserves the current diagram. Related test: T-019.

## R-024 — Operate resources with the keyboard

Focusing a resource selects it and shows its name; arrow keys move it and Delete removes it. Related tests: T-017 and T-020. Tab navigation is not yet tested.

## R-025 — Preserve earlier diagrams and mixed element diagrams

Existing version 1 goal-only files can be opened. Diagrams containing multiple supported element types can be saved and reopened with their types, names and positions. Related tests: T-021 and T-022. New mixed diagrams use version 2; goal-only diagrams continue to use version 1.

## R-026 — Element colors (design constraint)

The four element types use distinct, very light pastel fill colors in both the palette and the diagram: goals are yellow, tasks green, softgoals / qualities orange, and resources blue. Selection must remain visible. Related test: T-023 checks the palette and diagram fill colors for all four types; selection appearance is not yet tested.

## R-027 — Palette shape labels (design constraint)

The palette displays each element's name inside its shape: Goal, Quality, Task, and Resource. Related test: T-024 checks the text and visibility of all four labels.

## R-033 — Contribution palette guidance (design constraint)

The contribution tool displays a curved link with a destination arrow and the labels Make, Help, Hurt, and Break. On-demand palette help explains that the user selects a link tool, then the source and destination elements or actor circles, and can cancel with Escape. Related test: T-033.

## R-028 — Draw contribution links

The user selects the contribution tool, then a source and destination element or actor circle. A curved link connects them, with no arrowhead at the source and an open arrowhead at the destination. The user can cancel drawing with Escape. This version does not enforce iStar restrictions on element types. Related tests: T-025 and T-031.

## R-029 — Choose a contribution label

A contribution link has one of four labels: Make, Help, Hurt, or Break. A new link starts as Make; the user can select a link and change its label using the Contribution control. Related test: T-026.

## R-030 — Maintain and delete contribution links

Links remain attached when connected elements move. Selecting a link allows its deletion; deleting an element also removes its connected links. Related tests: T-027 and T-030.

## R-031 — Save and load contribution links

Links retain their source, destination and label when saved and reopened. Version 1 and version 2 diagrams remain supported. Related tests: T-028, T-021 and T-022. Diagrams with links use version 3 of the local JSON format.

## R-032 — Reject invalid link data

Files with invalid links are rejected and do not replace the current diagram. Related test: T-029 checks a missing endpoint; other invalid cases are not yet individually tested.

## R-034 — Create and identify actors (design constraint)

The palette offers an actor tool for click or drag placement. An actor has a small, very light cream named circle at the upper left of a large grey circular boundary with a dotted outline. Its cream fill is distinct from the goal fill and appears in the palette and on the canvas. New actors have a boundary radius of 125 canvas units, are named Actor, and may be renamed. The boundary stays on the canvas; actors count as elements. Related tests: T-034 and T-053. Palette drag placement is not yet tested.

## R-035 — Actor containment

An intentional element belongs to an actor when its center is within the actor's boundary, including when placed there or moved there by dragging or arrow keys. Moving it outside removes it from the actor without deleting it. If boundaries overlap, the most recently created actor takes precedence. A contribution belongs to an actor when both endpoints belong to that actor; its curve is kept inside that boundary. Related test: T-035 checks placement, drag entry and exit, and link membership. Overlap and keyboard boundary crossings are not yet tested.

## R-036 — Move and delete actors

An actor can be selected, renamed, dragged or moved with arrow keys. Moving it carries the elements it contains and their attached links. Deleting an actor leaves its elements and links on the canvas. Related tests: T-034 and T-036.

## R-037 — Save and load actor diagrams

A diagram with actors uses version 4 of the local JSON format, preserving actors, their boundary sizes, elements, links, and positions. Older version 4 actor records without a size use the original default radius. Containment is determined from positions when opened. Invalid actor data is rejected without replacing the current diagram. Versions 1–3 remain supported. Related tests: T-037, T-038, T-022 and T-028.

## R-038 — Default element size (design constraint)

Goals, qualities, tasks and resources are drawn at a smaller default size, comparable in width to the small circle identifying an actor. Related test: T-039.

## R-039 — Resize actor boundaries

A selected actor's boundary can be resized using its visible drag handle or the keyboard-accessible Boundary size control. The radius is limited to 100–400 canvas units and to the space available within the canvas. The actor circle follows the boundary. Expanding or shrinking it immediately recalculates which elements and links belong to the actor; elements and links remain on the canvas. The size is saved and restored. Related tests: T-040 and T-041.

## R-040 — Contribution label size (design constraint)

Contribution link labels use the same text size as element labels on the canvas. Related test: T-042.

## R-041 — Resize intentional elements

A selected goal, quality, task or resource can be resized uniformly from 50% to 200% of its default size using its drag handle or the keyboard-accessible Element size control. Its text remains the same size and reflows to show more of the name as the element grows; connected links remain attached. Actor membership continues to be determined by the element's center. Resized element sizes are saved and restored using version 5 of the local diagram format; older diagrams open at the default size. Invalid size data is rejected without replacing the diagram. Related tests: T-043–T-047.

## R-042 — Collapse and expand actors

The user can select an actor and collapse or expand it using its properties. When collapsed, its boundary, contained elements and links between hidden elements disappear, while its named circle remains. Cross-boundary links remain visible: each hidden element endpoint is visually redirected to its actor circle, without changing the stored endpoints. Links directly connected to the actor remain connected to it. Expanding restores the original elements, internal links and link endpoints. The actor can be moved while collapsed, carrying its hidden elements. Links between elements in different collapsed actors are redirected at both ends. Actor links can be created by selecting actor circles as endpoints. Related tests: T-048, T-049 and T-051.

## R-043 — Save collapsed actors and actor links

Collapsed state, hidden elements, and original link endpoints are preserved when saving and opening a diagram. Diagrams containing collapsed actors or direct actor links use version 6; older versions remain supported. Invalid collapsed state is rejected without replacing the diagram. Related tests: T-050 and T-052.

## R-044 — AND, OR and Needed by links

The palette provides AND, OR and Needed by tools, each with a labeled icon. The user selects a tool, then distinct source and destination elements or actor circles; Escape cancels drawing. The three types are straight and show their fixed labels. AND has a short perpendicular bar near its destination, OR has a filled triangular destination arrowhead, and Needed by has a small outlined destination circle. A straight link cannot connect an endpoint to itself. Links follow moved or resized endpoints, can be selected and deleted, and use the same actor containment and collapsed-actor visual redirection as contribution links. Related tests: T-054, T-055, T-057 and T-059; resizing and internal links for each type are not individually tested.

## R-045 — Save and open straight links

Diagrams containing AND, OR or Needed by links use version 7 of the local JSON format and preserve link type, label and original endpoints. Earlier diagram versions remain supported. Invalid link data is rejected without replacing the diagram. Related tests: T-056, T-058 and T-059.

## R-046 — Preserve viewport when placing elements

Placing an element or actor must not scroll the page or canvas to the properties panel. Related test: T-060 checks click placement with a scrolled canvas; drag placement uses the same placement operation.

## R-047 — Compact palette and optional guidance (design constraint)

Link tools use a compact layout. Palette instructions are hidden initially and remain available through the How to use the palette control. Related tests: T-033 and T-061.

## R-048 — Expand the canvas

The user can add space to the right or below the diagram in increments of 600 or 400 canvas units, up to 6000 by 4000. The existing diagram remains the same visual scale, and scrolling exposes the added area. Elements and actors can be placed, moved and resized within the enlarged bounds. Expanded dimensions and diagram contents are saved in version 8 and restored; invalid dimensions are rejected without replacing the diagram. Earlier formats open at the original 1200 by 800 size. Related tests: T-062, T-063 and T-064.

## R-049 — Zoom the canvas view

The user can zoom in or out in 25% steps from 50% to 200%, see the current zoom level, and reset it to 100%. Zoom changes only the view: element dimensions and diagram coordinates remain unchanged, and it works with expanded canvases. Zoom is not stored in diagram files. Related tests: T-065 and T-066.

## R-050 — Draw dependency links

The dependency palette tool draws a curved link with a D on the line. The user selects the dependent element or actor first, then the distinct element or actor it depends on; the curved side of the D faces the second endpoint and turns as the endpoints move. The link follows and remains attached to its endpoints, supports actor collapse and expansion, can be selected and deleted, and can be cancelled with Escape while drawing. Related tests: T-067–T-070. Direct actor endpoints and deletion have not yet been individually tested for this link type.

## R-051 — Save and open dependency links

Diagrams containing dependency links use version 9 and preserve endpoint order, link type, expanded canvas dimensions and collapsed actor state. Earlier diagram versions remain supported; invalid dependency data does not replace the current diagram. Related tests: T-067, T-069 and T-070.

## R-052 — Export diagrams as PNG, SVG and PDF

The Export menu downloads the complete diagram as PNG, SVG or a single-page PDF, independent of the current zoom or scroll position. Exports show the current expanded or collapsed actor view, with a white background and the diagram grid, but without selection highlights or editing handles. SVG and PDF retain vector shapes and text. PNG renders at twice the canvas dimensions when possible, with a 32-megapixel limit for large canvases. Export does not mark unsaved diagram changes as saved; JSON remains the editable format. Related tests: T-071–T-074.

## Regression tests

These test IDs are included in the Playwright test titles and reports. A test may cover several requirements, and a requirement may have several tests. A listed test does not necessarily cover every aspect of a requirement; coverage limits are noted above.

| Test ID | Test | Related requirements |
| --- | --- | --- |
| T-001 | Create, rename, select and delete a goal | R-001, R-001.1, R-001.2 |
| T-002 | Drag and arrow keys move a goal within the canvas | R-004, R-006 |
| T-003 | Save and reopen preserves goal name and position | R-002, R-003 |
| T-004 | Invalid files report an error and preserve the diagram | R-005 |
| T-005 | Keyboard focus selects, moves and deletes a goal | R-001.2, R-004, R-006 |
| T-006 | Create, name, select and delete a softgoal / quality | R-007, R-007.1, R-007.2 |
| T-007 | Drag and arrow keys move a softgoal / quality | R-010, R-012 |
| T-008 | Save and reopen a softgoal / quality | R-008, R-009 |
| T-009 | Invalid files preserve a softgoal / quality | R-011 |
| T-010 | Keyboard focus selects, moves and deletes a softgoal / quality | R-007.2, R-010, R-012 |
| T-011 | Create, name, select and delete a task | R-013, R-013.1, R-013.2 |
| T-012 | Drag and arrow keys move a task | R-016, R-018 |
| T-013 | Save and reopen a task | R-014, R-015 |
| T-014 | Invalid files preserve a task | R-017 |
| T-015 | Keyboard focus selects, moves and deletes a task | R-013.2, R-016, R-018 |
| T-016 | Create, name, select and delete a resource | R-019, R-019.1, R-019.2 |
| T-017 | Drag and arrow keys move a resource | R-022, R-024 |
| T-018 | Save and reopen a resource | R-020, R-021 |
| T-019 | Invalid files preserve a resource | R-023 |
| T-020 | Keyboard focus selects, moves and deletes a resource | R-019.2, R-022, R-024 |
| T-021 | Save and reopen a mixed diagram | R-002, R-003, R-008, R-009, R-014, R-015, R-020, R-021, R-025 |
| T-022 | Open a legacy version 1 goal diagram | R-003, R-025 |
| T-023 | Palette and diagram use the specified pastel element colors | R-026 |
| T-024 | Palette shapes show their element names | R-027 |
| T-025 | Create contribution with curved line and destination arrow | R-028 |
| T-026 | Choose and edit each contribution label | R-029 |
| T-027 | Links follow moving elements and can be deleted | R-030 |
| T-028 | Save and reopen contribution links | R-031 |
| T-029 | Invalid links are rejected without replacing the diagram | R-032 |
| T-030 | Deleting an element removes connected links | R-030 |
| T-031 | Cancel link creation without changing the diagram | R-028 |
| T-032 | New quality has the default name Quality | R-007.1 |
| T-033 | Contribution palette icon and creation instructions | R-033 |
| T-034 | Create and name an actor with a dotted boundary | R-034, R-036 |
| T-035 | Move elements into and out of actors; track link membership | R-035 |
| T-036 | Move and delete actors while preserving elements and links | R-036 |
| T-037 | Save and reopen actors, elements and links | R-037 |
| T-038 | Reject invalid actor data without replacing the diagram | R-037 |
| T-039 | Default element sizes are comparable to the actor circle | R-038 |
| T-040 | Resize boundaries and update containment without deleting elements | R-039 |
| T-041 | Preserve boundary size and open older actor diagrams | R-037, R-039 |
| T-042 | Contribution and element labels use the same text size | R-040 |
| T-043 | Resize every element type using its keyboard control | R-041 |
| T-044 | Drag to resize an element while maintaining its links and actor membership | R-041 |
| T-045 | Save and reopen element sizes and open legacy diagrams | R-041 |
| T-046 | Reject invalid element sizes without replacing the diagram | R-041 |
| T-047 | Resizing keeps text size fixed and reveals more of the name | R-041 |
| T-048 | Collapse hides contents and redirects external links | R-042 |
| T-049 | Move collapsed actors and redirect links between them | R-042 |
| T-050 | Save and reopen collapsed actors with original endpoints | R-043 |
| T-051 | Create actor links and preserve them through collapse | R-028, R-042 |
| T-052 | Reject invalid actor collapse state | R-043 |
| T-053 | A new actor does not include an element outside its smaller default boundary | R-034, R-035 |
| T-054 | Draw three straight link types with distinct target decorations | R-044 |
| T-055 | Move, cancel and delete straight links; reject self links | R-044 |
| T-056 | Save and reopen straight links | R-045 |
| T-057 | Redirect straight links when actors collapse | R-044 |
| T-058 | Reject invalid straight link data | R-045 |
| T-059 | Connect straight links directly to actor circles and reopen | R-044, R-045 |
| T-060 | Placing an element preserves page and canvas scroll positions | R-046 |
| T-061 | Open and close palette guidance and check compact links | R-047 |
| T-062 | Expand the canvas, place elements and save and reopen | R-048 |
| T-063 | Place, resize and move actors in expanded space | R-048 |
| T-064 | Reject invalid canvas dimensions | R-048 |
| T-065 | Zoom in, out and reset without changing diagram data | R-049 |
| T-066 | Zoom an expanded canvas and place elements at the correct coordinates | R-049 |
| T-067 | Draw and save an ordered dependency link | R-050, R-051 |
| T-068 | Dependency D faces the target as endpoints move | R-050 |
| T-069 | Restore dependencies with collapsed actors and expanded canvas | R-050, R-051 |
| T-070 | Cancel dependency creation and reject invalid data | R-050, R-051 |
| T-071 | Export complete SVG without editing controls | R-052 |
| T-072 | Export complete PNG independently of zoom | R-052 |
| T-073 | Export a PDF of the complete canvas | R-052 |
| T-074 | Preserve collapsed view and unsaved edits during export | R-052 |

## Maintaining this list

For each new feature, add a requirement ID, describe observable behavior, and link its regression tests by ID. Give each new test a unique, stable ID in its title and add it to the table. Do not reuse retired IDs. Record any important behavior that is not yet covered. Run the full test suite after changes and report the results; update requirements and tests when a change intentionally replaces existing behavior.
