import {useCallback, useEffect, useMemo, useRef} from 'react';
import {useStore} from 'effector-react';
import {
  FieldArrayParams, MapFieldArrayCallback,
} from '../index';
import {getIn, setIn, removeFromInlineMap} from './utils/object-manager';
import {createEvent} from 'effector';

const useFieldArray = <Values>({$fieldsInline, $values, name}: FieldArrayParams<Values>) => {
  const refName = useRef(name);
  refName.current = name;

  const remove = useMemo(() => createEvent<number>('hookForm_fieldArray_Remove'), []);
  const push = useMemo(() => createEvent<any | Array<any>>('hookForm_fieldArray_Push'), []);
  const unshift = useMemo(() => createEvent<any>('hookForm_fieldArray_Unshift'), []);
  const move = useMemo(() => createEvent<{from: number, to: number}>('hookForm_fieldArray_Move'), []);
  const insert = useMemo(() => createEvent<{value: any, index: number}>('hookForm_fieldArray_Insert'), []);
  const swap = useMemo(() => createEvent<{from: number, to: number}>('hookForm_fieldArray_Swap'), []);

  const values = useStore($values);

  const map = useCallback((callback: MapFieldArrayCallback) => {
    const results = [];
    const fields = getIn(values, refName.current, []);
    fields.forEach((field, index) => {
      const callbackResult = callback({
        formItemName: `${refName.current}.${index}`,
        fields,
        field,
        index,
      });
      results.push(callbackResult);
    });
    return results;
  }, [values]);

  useEffect(() => {
    $fieldsInline.on(remove, (fieldsInline, index) => removeFromInlineMap(fieldsInline, `${refName.current}.${index}`));
    $values.on(remove, (values, index) => {
      const newFields = getIn(values, refName.current, []).filter((_, i) => i !== index);
      return setIn(values, refName.current, newFields);
    });

    // $fieldsInline will be initialize automatically because it's new field
    $values.on(push, (values, value) => {
      let newFields = [...getIn(values, refName.current, [])];

      if (Array.isArray(value)) {
        newFields.push(...value)
      } else {
        newFields.push(value)
      }
      return setIn(values, refName.current, newFields);
    });

    $values.on(unshift, (values, value) => { // todo implement for fieldsInline
      const newFields = [value, ...getIn(values, refName.current, [])];
      return setIn(values, refName.current, newFields);
    });

    $values.on(move, (values, {from, to}) => { // todo implement for fieldsInline
      const fields = getIn(values, refName.current, []);
      const newFields = [];
      let movingField = {};
      fields.forEach((field, i) => {
        if (from === i) {
          movingField = field;
        } else if (to === i) {
          newFields.push(field);
          newFields.push(movingField);
        } else {
          newFields.push(field);
        }
      });
      return setIn(values, refName.current, newFields);
    });

    $values.on(insert, (values, {index, value}) => { // todo implement for fieldsInline
      const fields = getIn(values, refName.current);
      const newFields = [];
      fields.forEach((field, i) => {
        if (index === i) {
          newFields.push(value);
          newFields.push(field);
        } else {
          newFields.push(field);
        }
      });
      return setIn(values, refName.current, newFields);
    });

    $values.on(swap, (values, {from, to}) => { // todo implement for fieldsInline
      const fields = getIn(values, refName.current);
      const newFields = [];
      fields.forEach((field, i) => {
        if (from === i) {
          newFields.push(fields[to]);
        } else if (to === i) {
          newFields.push(fields[from]);
        } else {
          newFields.push(field);
        }
      });
      return setIn(values, refName.current, newFields);
    });

    return () => {
      $values.off(remove);
      $values.off(push);
      $values.off(unshift);
      $values.off(move);
      $values.off(insert);
      $values.off(swap);
    };
  }, []);

  return {
    map,
    remove,
    push,
    unshift,
    move,
    insert,
    swap,
  };
};

export default useFieldArray;
