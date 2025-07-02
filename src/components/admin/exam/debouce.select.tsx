import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Select, Spin } from 'antd';
import type { SelectProps } from 'antd/es/select';
import debounce from 'lodash/debounce';

export interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  fetchOptions: (search: string) => Promise<ValueType[]>;
  debounceTimeout?: number;
}

export function DebounceSelect<
  ValueType extends { key?: string; label: React.ReactNode; value: string | number } = any,
>({
  fetchOptions,
  debounceTimeout = 800,
  value,
  onChange,
  ...props
}: DebounceSelectProps<ValueType>) {
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<ValueType[]>([]);
  const fetchRef = useRef(0);

  const debounceFetcher = useMemo(() => {
    const loadOptions = (searchValue: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);

      fetchOptions(searchValue).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          return;
        }
        setOptions(newOptions);
        setFetching(false);
      });
    };

    return debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);

  const handleOnFocus = () => {
    if (options.length === 0) {
      fetchOptions('').then((newOptions) => {
        setOptions(newOptions);
      });
    }
  };

  const handleOnBlur = () => {
    // Tùy bạn: nếu muốn giữ lại options, bỏ dòng này đi
    setOptions([]);
  };

  return (
    <Select
      labelInValue
      showSearch
      value={value}
      onChange={onChange}
      filterOption={false}
      onSearch={debounceFetcher}
      notFoundContent={fetching ? <Spin size="small" /> : null}
      options={options}
      onFocus={handleOnFocus}
      onBlur={handleOnBlur}
      {...props}
    />
  );
}
